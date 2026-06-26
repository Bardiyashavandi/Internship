# Spec: Agent Loop

## Problem
A user sends a natural language request that may require one or more tool calls.
The agent must reason about what to do, call the right tools in the right order,
and return a final answer.

## Inputs & Outputs
- Input: user_request: str — e.g. "What's the weather in Istanbul and how many euros is 100 USD?"
- Output: str — the agent's final answer

## Behavior
- Send user request to Claude with a system prompt listing available tools
- Claude returns a structured JSON action: call_tool or respond
- If call_tool: look up the tool in the registry, execute it, feed result back to Claude
- If unknown tool: return error dict and continue
- If respond: return the response to the user
- If Claude returns malformed JSON: send correction message and retry that turn
- Cap conversation history at MAX_HISTORY=10 messages
- Repeat up to max_turns=5 times before giving up

## Non-Goals
- No memory between separate conversations
- No parallel tool calls (sequential only)
- No streaming output
- No user-facing logs

## Acceptance Criteria
- [ ] Correctly calls get_weather for weather questions
- [ ] Correctly calls get_exchange_rate for currency questions
- [ ] Handles multi-tool question in one run (3 turns)
- [ ] Logs every turn with action and reasoning
- [ ] Returns "Max turns reached" if loop exceeds max_turns
- [ ] Recovers gracefully from malformed JSON without crashing
- [ ] Returns error dict for unknown tool without crashing