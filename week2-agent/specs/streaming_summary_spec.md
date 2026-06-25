# Spec: Streaming Weather Summary

## Problem
Users want a conversational, human-readable weather summary that streams in real time
instead of waiting for the full response.

## Inputs & Outputs
- Input: city: str
- Output: streamed text printed to stdout word by word

## Behavior
- Fetch coordinates and raw weather for the city
- Call Claude with streaming enabled
- Print each text chunk as it arrives using stream.text_stream
- Summary should be friendly and conversational, not technical

## Non-Goals
- No structured output (this is for humans, not machines)
- No Pydantic validation (plain text only)
- No saving the summary to a variable

## Acceptance Criteria
- [ ] Text appears word by word, not all at once
- [ ] Summary mentions temperature, condition, and wind
- [ ] Works for any valid city
- [ ] Raises ValueError for invalid city
