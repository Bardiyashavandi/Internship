# Skills Showcase — Shipping Support Agent

A minimal example agent built to demonstrate core AI-agent-engineering concepts (from Day 3 of the Kaggle 5-Day AI Agents Intensive): defining an agent's behavior in a standalone "skill" file, classifying user input, and routing it to the right handler.

## What It Does

The agent receives a user query and decides how to handle it:

1. **Classify** — `classify_query()` checks the query against a list of shipping-related keywords (tracking, delivery, rates, returns, etc.) to decide if it's in scope.
2. **Route**
   - If shipping-related → the query is combined with the instructions in `SKILL.md` and sent to Gemini (`gemini-2.5-flash`), which generates a helpful, on-brand answer.
   - If unrelated → the agent politely declines without calling the model.

```
User Query
    │
    ▼
Classify (shipping or unrelated?)
    │
    ├── shipping  → Gemini + SKILL.md instructions → helpful answer
    └── unrelated → polite, fixed decline message
```

When run directly, `agent.py` walks through five example queries (tracking, rates, weather, returns, restaurant recommendation) and prints the classification and response for each.

## Files

- `SKILL.md` — defines the agent's role, classification rules, and tone (the "skill" the agent follows)
- `agent.py` — agent logic: keyword classifier, Gemini call for shipping queries, and the demo runner
- `README.md` — this file

## Concepts Demonstrated

- Agent Skills (instructions kept in a separate `SKILL.md` rather than hardcoded in the prompt)
- Progressive disclosure (the model only sees the skill instructions when the query is in scope)
- Simple DAG-style orchestration (classify → route → respond)
- Keyword-based tool/intent routing

## Running It

Requires a Gemini API key:

```bash
export GEMINI_API_KEY="your-key-here"
python3 agent.py
```

Note: the code reads `GEMINI_API_KEY`, even though the original instructions mentioned `ANTHROPIC_API_KEY` — make sure the Gemini key is set or the shipping-query calls will fail.

## Status

Educational/demo project, not production code. No tests included.
