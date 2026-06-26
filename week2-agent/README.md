# 🤖 Week 2 Agent

> A production-grade weather + currency agent built with Claude AI during Week 2 of the AI Engineering Internship.

---

## What it does

Ask any natural language question about weather or currency — the agent reasons about what tools to call, executes them in sequence, and returns a final answer.

```bash
$ python agent_loop.py

Final answer: Here's the information you requested:

🌤️ Weather in Istanbul:
  Temperature: 30°C
  Humidity: 35%
  Wind Speed: 22.4 km/h
  Conditions: Clear sky

💱 Currency Exchange:
  100 USD = 88.17 EUR
```

---

## How it works

```
user request (natural language)
    ↓
Claude decides what to do
    ↓
call get_weather?        →   Open-Meteo API
call get_exchange_rate?  →   Frankfurter API
    ↓
feed result back to Claude
    ↓
Claude decides again → respond or call another tool
    ↓
final answer
```

---

## Stack

| Tool | Purpose |
|------|---------|
| Python 3.12 | Core language |
| Poetry | Dependency management |
| Docker | Containerization |
| Claude Sonnet 4.6 | Agent reasoning + structured output |
| Pydantic | Data validation |
| httpx | HTTP client |
| Open-Meteo | Free weather API, no key needed |
| Frankfurter | Free currency API, no key needed |

---

## Why Poetry + Docker

**Poetry** manages Python dependencies in an isolated virtual environment.
Every developer who clones this repo gets byte-for-byte identical packages via `poetry.lock`.

**Docker** packages the entire environment — Python version, packages, and config —
into a single image. Run it anywhere without any setup.

---

## Setup

### Run locally with Poetry

```bash
poetry install
eval $(poetry env activate)
python agent_loop.py
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

## Files

| File | Purpose |
|------|---------|
| `agent_loop.py` | Main agent — reasoning loop with 2 tools |
| `weather_agent.py` | Standalone weather script with streaming |
| `specs/agent_loop_spec.md` | Agent loop feature spec |
| `specs/tools_spec.md` | Tool specs for weather and currency |
| `specs/weather_agent_spec.md` | Weather agent spec |
| `specs/weather_fetcher_spec.md` | Open-Meteo fetcher spec |
| `specs/weather_parser_spec.md` | Claude parser spec |
| `specs/streaming_summary_spec.md` | Streaming summary spec |

---

## Features

- 🌍 Any city in the world via Open-Meteo geocoding
- 💱 Live currency exchange rates via Frankfurter
- 🤖 Claude reasons about which tools to call and in what order
- ✅ Pydantic validation on every LLM response
- 🔁 Exponential backoff retry on rate limits
- ⚠️ Graceful recovery from malformed JSON output
- 📋 Structured logging with timestamps and severity levels
- 🪟 Conversation history cap to prevent context overflow
- 🐳 Fully containerized with Docker

---

## Project Structure

```
week2-agent/
├── agent_loop.py               main agent with reasoning loop
├── weather_agent.py            standalone weather script
├── specs/
│   ├── agent_loop_spec.md
│   ├── tools_spec.md
│   ├── weather_agent_spec.md
│   ├── weather_fetcher_spec.md
│   ├── weather_parser_spec.md
│   └── streaming_summary_spec.md
├── Dockerfile
├── pyproject.toml
├── poetry.lock
└── .env                        not committed
```

---

*Built as part of a 6-week AI Engineering Internship — Week 2: LLMs, Prompting & Context Engineering*
