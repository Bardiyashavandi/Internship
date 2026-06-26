# Spec: Agent Loop

## Problem
A user sends a natural language request. The agent must decide whether to call a tool
or respond directly, executing tools as needed until it has a final answer.

## Inputs & Outputs
- Input: user_request: str — e.g. "What's the weather in Istanbul?"
- Output: str — the agent's final answer

## Behavior
- Send user request to Claude with a system prompt listing available tools
- Claude returns a structured JSON action: call_tool or respond
- If call_tool: execute the tool, feed result back to Claude as a new message
- If respond: return the response to the user
- Repeat up to max_turns times
- Cap conversation history at MAX_HISTORY messages to avoid context overflow
- If Claude returns malformed JSON: send a correction message and retry

## Non-Goals
- No memory between separate conversations
- No parallel tool calls (sequential only)
- No streaming output

## Acceptance Criteria
- [ ] Agent correctly calls get_weather for weather questions
- [ ] Agent correctly calls get_exchange_rate for currency questions
- [ ] Agent handles a multi-tool question in one run
- [ ] Returns "Max turns reached" if loop exceeds max_turns
- [ ] Logs every turn with action and reasoning
- [ ] Gracefully recovers from malformed JSON output