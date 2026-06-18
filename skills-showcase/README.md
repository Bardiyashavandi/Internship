# Skills Showcase — Day 3

A simple agent demonstrating core AI engineering concepts from Day 3 of the Kaggle 5-Day AI Agents Intensive.

## What It Does
Takes a user query, classifies it, and routes it to the right handler:User Query

│

▼

Classify (shipping or unrelated?)

│

├── shipping → FAQ Agent → helpful answer

└── unrelated → polite decline## Concepts Demonstrated
- Agent Skills (SKILL.md)
- Progressive disclosure
- DAG orchestration
- Tool routing

## How To Run
```bash
export ANTHROPIC_API_KEY="your-key-here"
python3 agent.py
```

## File Structureskills-showcase/

├── SKILL.md    ← the agent skill

├── agent.py    ← the agent logic

└── README.md   ← this file


