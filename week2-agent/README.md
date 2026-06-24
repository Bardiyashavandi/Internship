# Week 2 Agent

A Python agent built during Week 2 of the AI Engineering Internship.

## Stack
- Python 3.12
- Poetry (dependency management)
- Docker (containerization)
- Anthropic, Pydantic, httpx

## Setup

### Run locally with Poetry
```bash
poetry install
eval $(poetry env activate)
python agent.py
```

### Run with Docker
```bash
docker build -t week2-agent .
docker run week2-agent
```

## Project Structure
week2-agent/

├── Dockerfile

├── pyproject.toml

├── poetry.lock

├── README.md

├── agent.py

└── src/
