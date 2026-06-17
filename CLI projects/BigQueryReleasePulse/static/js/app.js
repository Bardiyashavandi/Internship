// Global state
let allReleases = [];
let currentFilter = 'All';
let searchQuery = '';
let selectedRelease = null;

// DOM Elements
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const emptyState = document.getElementById('empty-state');
const feedGrid = document.getElementById('feed-grid');
const refreshBtn = document.getElementById('refresh-btn');
const refreshSpinner = document.getElementById('refresh-spinner');
const retryBtn = document.getElementById('retry-btn');
const themeToggle = document.getElementById('theme-toggle');
const searchInput = document.getElementById('search-input');
const clearSearch = document.getElementById('clear-search');
const filterButtons = document.querySelectorAll('.filter-btn');

// Stats Elements
const statAllCount = document.getElementById('stat-all-count');
const statFeatureCount = document.getElementById('stat-feature-count');
const statAnnouncementCount = document.getElementById('stat-announcement-count');
const statIssueCount = document.getElementById('stat-issue-count');
const statCards = document.querySelectorAll('.stat-card');

// Modal Elements
const tweetModal = document.getElementById('tweet-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const cancelTweetBtn = document.getElementById('cancel-tweet-btn');
const publishTweetBtn = document.getElementById('publish-tweet-btn');
const tweetTextarea = document.getElementById('tweet-text');
const charCounter = document.getElementById('char-counter');
const previewBadge = document.getElementById('preview-badge');
const previewSnippet = document.getElementById('preview-snippet');

// Toast Element
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// Theme Initializer
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function updateThemeIcon(theme) {
    const icon = themeToggle.querySelector('i');
    if (theme === 'light') {
        icon.className = 'fa-solid fa-sun';
    } else {
        icon.className = 'fa-solid fa-moon';
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadReleaseNotes();

    // Refresh Action
    refreshBtn.addEventListener('click', loadReleaseNotes);
    retryBtn.addEventListener('click', loadReleaseNotes);

    // Theme Toggle Action
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    // Search input handler
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        clearSearch.style.display = searchQuery.length > 0 ? 'block' : 'none';
        applyFiltersAndRender();
    });

    clearSearch.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearch.style.display = 'none';
        searchInput.focus();
        applyFiltersAndRender();
    });

    // Filter Buttons
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            applyFiltersAndRender();
        });
    });

    // Stat Cards (Quick Filter Interaction)
    statCards.forEach(card => {
        card.addEventListener('click', () => {
            const filterType = card.dataset.type;
            const targetBtn = document.querySelector(`.filter-btn[data-filter="${filterType}"]`);
            if (targetBtn) {
                targetBtn.click();
                // Scroll smoothly to releases section
                document.querySelector('.control-bar').scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Tweet Modal actions
    closeModalBtn.addEventListener('click', closeTweetModal);
    cancelTweetBtn.addEventListener('click', closeTweetModal);
    tweetTextarea.addEventListener('input', updateCharCount);
    publishTweetBtn.addEventListener('click', publishTweet);

    // Close modal on clicking outside modal content
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) {
            closeTweetModal();
        }
    });
});

// Fetch data from Flask API
async function loadReleaseNotes() {
    // Show Loading
    setLoadingState(true);
    refreshSpinner.classList.add('spinning');
    refreshBtn.disabled = true;

    try {
        const response = await fetch('/api/releases');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        allReleases = data.releases || [];
        updateStats();
        applyFiltersAndRender();
        
        // Hide loader & show success
        setErrorState(false);
    } catch (error) {
        console.error('Error fetching release notes:', error);
        errorMessage.textContent = error.message || 'We encountered an issue fetching the latest BigQuery release notes.';
        setErrorState(true);
    } finally {
        setLoadingState(false);
        refreshSpinner.classList.remove('spinning');
        refreshBtn.disabled = false;
    }
}

// UI State Toggles
function setLoadingState(isLoading) {
    loadingState.style.display = isLoading ? 'grid' : 'none';
    if (isLoading) {
        feedGrid.style.display = 'none';
        emptyState.style.display = 'none';
        errorState.style.display = 'none';
    }
}

function setErrorState(isError) {
    errorState.style.display = isError ? 'flex' : 'none';
    if (isError) {
        feedGrid.style.display = 'none';
        emptyState.style.display = 'none';
        loadingState.style.display = 'none';
    }
}

// Calculate and update stats cards
function updateStats() {
    const total = allReleases.length;
    const features = allReleases.filter(r => r.type.toLowerCase().includes('feature')).length;
    const announcements = allReleases.filter(r => r.type.toLowerCase().includes('announcement')).length;
    const issues = allReleases.filter(r => r.type.toLowerCase().includes('issue')).length;

    statAllCount.textContent = total;
    statFeatureCount.textContent = features;
    statAnnouncementCount.textContent = announcements;
    statIssueCount.textContent = issues;
}

// Filter and Search logic
function applyFiltersAndRender() {
    let filtered = [...allReleases];

    // Apply category filter
    if (currentFilter !== 'All') {
        filtered = filtered.filter(release => {
            // Handle specific category match
            const type = release.type.toLowerCase();
            const filter = currentFilter.toLowerCase();
            return type.includes(filter);
        });
    }

    // Apply text search query
    if (searchQuery) {
        filtered = filtered.filter(release => {
            return (
                release.date.toLowerCase().includes(searchQuery) ||
                release.type.toLowerCase().includes(searchQuery) ||
                release.text.toLowerCase().includes(searchQuery)
            );
        });
    }

    renderFeed(filtered);
}

// Render release cards in the DOM
function renderFeed(releases) {
    feedGrid.innerHTML = '';
    
    if (releases.length === 0) {
        feedGrid.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }

    emptyState.style.display = 'none';
    feedGrid.style.display = 'grid';

    releases.forEach((release, index) => {
        const card = createReleaseCard(release, index);
        feedGrid.appendChild(card);
    });
}

// Helper to determine badge icon & class based on type
function getBadgeConfig(type) {
    const t = type.toLowerCase();
    if (t.includes('feature')) {
        return { class: 'badge-feature', icon: '<i class="fa-solid fa-wand-magic-sparkles"></i>' };
    } else if (t.includes('announcement')) {
        return { class: 'badge-announcement', icon: '<i class="fa-solid fa-bullhorn"></i>' };
    } else if (t.includes('issue')) {
        return { class: 'badge-issue', icon: '<i class="fa-solid fa-triangle-exclamation"></i>' };
    } else if (t.includes('deprecation')) {
        return { class: 'badge-deprecation', icon: '<i class="fa-solid fa-ban"></i>' };
    } else {
        return { class: 'badge-general', icon: '<i class="fa-solid fa-circle-info"></i>' };
    }
}

// Create single release card DOM Node
function createReleaseCard(release, index) {
    const card = document.createElement('div');
    card.className = 'release-card';
    card.style.animationDelay = `${Math.min(index * 0.05, 0.4)}s`;

    const badgeConfig = getBadgeConfig(release.type);

    card.innerHTML = `
        <div class="card-header">
            <span class="badge ${badgeConfig.class}">
                ${badgeConfig.icon} ${escapeHTML(release.type)}
            </span>
            <span class="card-date">${escapeHTML(release.date)}</span>
        </div>
        <div class="card-body">
            ${release.content}
        </div>
        <div class="card-footer">
            <button class="btn-icon-action btn-copy-action" title="Copy Direct Link" aria-label="Copy Link">
                <i class="fa-solid fa-link"></i>
            </button>
            <button class="btn-icon-action btn-tweet-action" title="Tweet about this update" aria-label="Tweet this">
                <i class="fa-brands fa-x-twitter"></i>
            </button>
        </div>
    `;

    // Click handlers for card actions
    const copyBtn = card.querySelector('.btn-copy-action');
    copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        copyToClipboard(release.link);
    });

    const tweetBtn = card.querySelector('.btn-tweet-action');
    tweetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openTweetModal(release);
    });

    return card;
}

// Clipboard Action
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Direct link copied to clipboard!');
    }).catch(err => {
        console.error('Could not copy link: ', err);
        showToast('Failed to copy link.', true);
    });
}

function showToast(message, isError = false) {
    toastMessage.textContent = message;
    toast.style.background = isError ? 'var(--color-issue)' : '#10b981';
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Tweet Composer Modal Management
function openTweetModal(release) {
    selectedRelease = release;
    
    // Set badge style in modal preview card
    const config = getBadgeConfig(release.type);
    previewBadge.className = `preview-badge ${config.class}`;
    previewBadge.textContent = release.type;
    
    // Build initial tweet text
    const initialText = generateSmartTweetText(release);
    tweetTextarea.value = initialText;
    
    // Set preview snippet
    previewSnippet.textContent = release.text;
    
    // Show Modal
    tweetModal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Lock background scroll
    
    updateCharCount();
    tweetTextarea.focus();
}

function closeTweetModal() {
    tweetModal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scroll
    selectedRelease = null;
}

// Format the default Tweet, intelligently truncating text so it stays under 280 characters
function generateSmartTweetText(release) {
    const date = release.date;
    const type = release.type;
    const text = release.text;
    const link = release.link;

    // Structure of the Tweet:
    // 📢 BigQuery Update ({date}) - {type}:
    // {summary}
    //
    // Learn more: {link} #GoogleCloud #BigQuery

    const header = `📢 BigQuery Update (${date}) - ${type}:\n`;
    const footer = `\n\nLearn more: ${link} #BigQuery`;
    
    const maxCombinedLen = 280;
    const fixedLen = header.length + footer.length;
    const availableSpace = maxCombinedLen - fixedLen - 4; // 4 extra chars for '...' safety margin

    let summary = text;
    if (summary.length > availableSpace) {
        summary = summary.substring(0, availableSpace).trim() + '...';
    }

    return `${header}${summary}${footer}`;
}

function updateCharCount() {
    const currentLen = tweetTextarea.value.length;
    charCounter.textContent = currentLen;
    
    if (currentLen > 280) {
        charCounter.parentElement.classList.add('warn');
        publishTweetBtn.disabled = true;
    } else {
        charCounter.parentElement.classList.remove('warn');
        publishTweetBtn.disabled = false;
    }
}

function publishTweet() {
    if (!selectedRelease) return;
    
    const tweetText = tweetTextarea.value;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    
    window.open(tweetUrl, '_blank', 'noopener,noreferrer');
    closeTweetModal();
}

// Utility Helpers
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
