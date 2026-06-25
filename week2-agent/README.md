# 🌤️ Weather Agent

> A production-grade weather agent built with Claude AI + Open-Meteo during Week 2 of the AI Engineering Internship.

---

## What it does

Ask for the weather in any city — the agent fetches live data, sends it to Claude, and returns a clean structured result. No vague chatbot responses, just typed, validated data.

---

## How it works

```
city name
    ↓
Open-Meteo Geocoding API   →   lat/lon coordinates
    ↓
Open-Meteo Forecast API    →   raw weather JSON
    ↓
Claude Sonnet 4.6          →   structured WeatherResult
    ↓
clean output
```

---

## Stack

| Tool | Purpose |
|------|---------|
| Python 3.12 | Core language |
| Poetry | Dependency management |
| Docker | Containerization |
| Claude Sonnet 4.6 | Structured output + weather code parsing |
| Pydantic | Data validation |
| httpx | HTTP client |
| Open-Meteo | Free weather API, no key needed |

---

## Setup

### Run locally with Poetry

```bash
poetry install
eval $(poetry env activate)
python weather_agent.py Istanbul
```

### Run with Docker

```bash
docker build -t week2-agent .
docker run --env-file .env week2-agent
```

### Environment variables

Create a `.env` file in the project root:

```
ANTHROPIC_API_KEY=your-key-here
```

---

## Usage

```bash
python weather_agent.py Istanbul
python weather_agent.py London
python weather_agent.py Tokyo
python weather_agent.py "New York"
```

---

## Features

- 🌍 Any city in the world via Open-Meteo geocoding
- 🤖 Claude converts raw weather codes into human-readable conditions
- ✅ Pydantic validation on every LLM response
- 🔁 Exponential backoff retry on rate limits
- ⚠️ Graceful error handling for invalid cities and network failures
- 🐳 Fully containerized with Docker

---

## Project Structure

```
week2-agent/
├── weather_agent.py            main agent
├── specs/
│   └── weather_agent_spec.md   feature spec written before coding
├── Dockerfile
├── pyproject.toml
├── poetry.lock
└── .env                        not committed
```

---

*Built as part of a 6-week AI Engineering Internship — Week 2: LLMs, Prompting & Context Engineering*
