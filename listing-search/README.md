# Listing Search

A small Python utility for searching real-estate listings on Idealista and normalizing the results into a clean, consistent format.

## What It Does

`search.py` exposes `search_listings()`, which:

- Queries the Idealista API (`/3.5/es/search`) for a given city, max price, minimum bedrooms, and property type
- Retries automatically (up to 3 times) on rate-limit (HTTP 429) responses, with exponential backoff
- Raises a clear error if the API key is missing or invalid
- Returns a clean list of listings via `parse_listing()`, which extracts title, price, size, bedroom count, location, and URL from each raw API record — falling back to sensible defaults when fields are missing

Running the script directly searches for flats in Madrid under €300,000 with at least 2 bedrooms and prints the results.

## Files

- `search.py` — API client, listing parser, and retry/error handling logic
- `test_search.py` — unit tests for `parse_listing()`, covering normal data, missing fields, and empty results

## Setup

Requires an Idealista API key, set as an environment variable (loaded via `.env`):

```bash
IDEALISTA_API_KEY=your-key-here
```

Dependencies: `httpx`, `python-dotenv`

## Running It

```bash
python3 search.py        # run the example search (Madrid, ≤€300k, 2+ bedrooms)
python3 test_search.py   # run the unit tests
```

## Status

Working script-level utility. No API key is included in the repo — one must be supplied via `.env` before it can hit the live Idealista API.
