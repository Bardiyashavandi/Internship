# Internship Projects

Overview of the work completed during this internship. Each project lives in its own folder with a detailed README — this page is a summary and index.

## Projects

### 1. [World Cup Tracker 2026](./AI-Studio-Projects/Game)
A React/TypeScript/Vite single-page app for following World Cup 2026 matches. Features a live match-simulation engine (auto-advancing clock, randomly generated goals/shots/fouls/cards with sound effects and confetti), manual score and status controls, custom fixture creation, live standings, and a real-time event log. Built with Tailwind CSS and Framer Motion; state persists in the browser via local storage.

**Stack:** React 19, TypeScript, Vite, Tailwind CSS

### 2. [Skills Showcase — Shipping Support Agent](./skills-showcase)
A demo AI agent built to illustrate core agent-engineering concepts: keeping instructions in a standalone `SKILL.md` file, classifying user queries, and routing them to the right handler. Shipping-related questions are answered using Gemini guided by the skill file; everything else gets a polite decline.

**Stack:** Python, Google Gemini API

**Concepts demonstrated:** Agent Skills, progressive disclosure, DAG-style orchestration, intent routing

### 3. [Listing Search](./listing-search)
A Python utility for searching real-estate listings on Idealista and normalizing the raw API response into a clean, consistent format. Includes retry/backoff handling for rate limits and a small unit test suite.

**Stack:** Python, httpx

### 4. [BigQuery Release Pulse](./CLI%20projects/BigQueryReleasePulse)
A Flask web app that fetches Google BigQuery's official release-notes feed, parses and organizes it by section, and serves it through a clean dashboard UI — an easier way to browse BigQuery updates than the raw Google Cloud feed page.

**Stack:** Python, Flask, BeautifulSoup

## Repository Structure

```
Internship/
├── AI-Studio-Projects/
│   └── Game/                    # World Cup Tracker 2026
├── skills-showcase/              # Shipping Support Agent demo
├── listing-search/               # Idealista listing search utility
└── CLI projects/
    └── BigQueryReleasePulse/     # BigQuery release notes dashboard
```

## Notes

Each project folder contains its own README with setup instructions, file structure, and current status (working prototype / demo / utility). None of the projects share dependencies or are connected to each other — they're independent pieces of work.
