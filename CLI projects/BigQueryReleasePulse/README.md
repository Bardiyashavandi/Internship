# BigQuery Release Pulse

A small Flask web app that fetches and displays Google BigQuery's release notes feed in a readable, organized dashboard, instead of the raw Google Cloud release-notes page.

## What It Does

- On request, the backend fetches the official BigQuery release-notes Atom feed (`docs.cloud.google.com/feeds/bigquery-release-notes.xml`)
- Each feed entry's HTML content is parsed with BeautifulSoup and split by its `<h3>` headings (e.g. "New features", "Breaking changes") into separate, individually-dated release entries
- Relative links in the content are rewritten to absolute URLs and set to open in a new tab
- Results are exposed as JSON via an API endpoint, and rendered in a simple HTML/JS frontend

### Routes

- `GET /` — serves the dashboard page (`templates/index.html`)
- `GET /api/releases` — fetches, parses, and returns the release notes as JSON (returns HTTP 500 with an error message if the feed can't be fetched or parsed)

## Files

```
BigQueryReleasePulse/
├── app.py                  # Flask app: feed fetching, XML/HTML parsing, routes
├── templates/index.html    # Dashboard page
├── static/css/style.css    # Styling
├── static/js/app.js        # Frontend logic (calls /api/releases and renders entries)
├── UI.png                  # Screenshot of the app
└── requirements.txt        # Flask, requests, beautifulsoup4
```

## Setup & Running

```bash
pip install -r requirements.txt
python3 app.py
```

The app runs on `http://0.0.0.0:5001` by default, with Flask debug mode enabled.

## Notes

- There is a `cache` dict declared in `app.py` for storing parsed results, but it is not currently populated or used — every request to `/api/releases` re-fetches and re-parses the live feed.
- No tests are included.

## Status

Working prototype/internal tool for browsing BigQuery release notes more easily.
