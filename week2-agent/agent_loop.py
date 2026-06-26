import json
import logging
import httpx
import time
from anthropic import Anthropic, RateLimitError, APIError
from pydantic import BaseModel, ValidationError
from typing import Literal
from dotenv import load_dotenv

load_dotenv()

# ── Logging setup ──────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ── Claude client ──────────────────────────────────────────────────────────────
client = Anthropic()

# ── Tool registry ──────────────────────────────────────────────────────────────
TOOLS = {}  # name -> callable

def register_tool(name):
    """Decorator to register a function as an agent tool."""
    def decorator(fn):
        TOOLS[name] = fn
        return fn
    return decorator

# ── Pydantic model for agent actions ──────────────────────────────────────────
class AgentAction(BaseModel):
    action: Literal["call_tool", "respond"]
    tool_name: str | None = None
    tool_input: dict | None = None
    response: str | None = None
    reasoning: str  # always require the model to show its work

# ── Tools ──────────────────────────────────────────────────────────────────────

@register_tool("get_weather")
def get_weather(city: str) -> dict:
    """Get current weather for a city using Open-Meteo."""
    geo = httpx.get(
        "https://geocoding-api.open-meteo.com/v1/search",
        params={"name": city, "count": 1}
    )
    geo.raise_for_status()
    results = geo.json().get("results")
    if not results:
        return {"error": f"City not found: {city}"}
    lat, lon = results[0]["latitude"], results[0]["longitude"]

    weather = httpx.get(
        "https://api.open-meteo.com/v1/forecast",
        params={
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
            "timezone": "auto"
        }
    )
    weather.raise_for_status()
    return weather.json()["current"]


@register_tool("get_exchange_rate")
def get_exchange_rate(from_currency: str, to_currency: str) -> dict:
    """Get current exchange rate between two currencies using Frankfurter."""
    resp = httpx.get(
        url = "https://api.frankfurter.dev/v1/latest",
        params={"from": from_currency, "to": to_currency}
    )
    resp.raise_for_status()
    return resp.json()

# ── System prompt ──────────────────────────────────────────────────────────────

SYSTEM = """
You are an agent. On each turn, output ONLY valid JSON matching this schema:
{
  "action": "call_tool" | "respond",
  "tool_name": "<tool name>" | null,
  "tool_input": {<arguments>} | null,
  "response": "<final answer>" | null,
  "reasoning": "<why you chose this action>"
}

Available tools:
- get_weather(city: str) — get current weather for a city
- get_exchange_rate(from_currency: str, to_currency: str) — get exchange rate

Rules:
- Always output valid JSON, nothing else
- Always include reasoning
- Call tools one at a time
- When you have enough information, use action: "respond"
"""

# ── Agent loop ─────────────────────────────────────────────────────────────────

MAX_HISTORY = 10  # max messages to keep in context

def parse_action(raw: str) -> AgentAction | None:
    """Parse Claude's JSON response into an AgentAction. Returns None on failure."""
    try:
        return AgentAction(**json.loads(raw))
    except json.JSONDecodeError:
        logger.error("Model returned non-JSON: %s", raw[:200])
        return None
    except ValidationError as e:
        logger.error("Schema mismatch: %s", e)
        return None

def call_with_retry(messages: list, max_retries: int = 3) -> str:
    """Call Claude with exponential backoff on rate limit errors."""
    for attempt in range(max_retries):
        try:
            response = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=512,
                system=SYSTEM,
                messages=messages
            )
            return response.content[0].text
        except RateLimitError:
            wait = 2 ** attempt
            logger.warning("Rate limited. Waiting %ds...", wait)
            time.sleep(wait)
        except APIError as e:
            logger.error("API error: %s", e)
            raise
    raise RuntimeError("Max retries exceeded")

def run_agent(user_request: str, max_turns: int = 5) -> str:
    """Run the agent loop until a final response or max turns reached."""
    messages = [{"role": "user", "content": user_request}]
    logger.info("Starting agent | request: %s", user_request)

    for turn in range(max_turns):
        # Trim history if growing too long
        if len(messages) > MAX_HISTORY:
            messages = messages[-MAX_HISTORY:]

        # Call Claude
        raw = call_with_retry(messages)

        # Parse response
        action = parse_action(raw)

        # Handle bad output — feed correction back instead of crashing
        if action is None:
            messages.append({"role": "assistant", "content": raw})
            messages.append({
                "role": "user",
                "content": "Your last response was not valid JSON. Return ONLY the JSON schema specified."
            })
            continue

        logger.info("Turn %d | action=%s | reasoning=%s", turn + 1, action.action, action.reasoning)

        # Final response
        if action.action == "respond":
            logger.info("Agent finished in %d turns", turn + 1)
            return action.response

        # Tool call
        if action.action == "call_tool":
            tool_fn = TOOLS.get(action.tool_name)
            if not tool_fn:
                result = {"error": f"Unknown tool: {action.tool_name}"}
                logger.warning("Tool not found: %s", action.tool_name)
            else:
                logger.info("Calling tool: %s with %s", action.tool_name, action.tool_input)
                result = tool_fn(**action.tool_input)
                logger.info("Tool result: %s", result)

            # Feed result back into conversation
            messages.append({"role": "assistant", "content": raw})
            messages.append({"role": "user", "content": f"Tool result: {json.dumps(result)}"})

    logger.warning("Max turns reached")
    return "Max turns reached without resolution."


# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    result = run_agent("What's the weather in Istanbul and how many euros is 100 USD?")
    print(f"\nFinal answer: {result}")