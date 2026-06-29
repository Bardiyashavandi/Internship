import anthropic
import httpx

from dotenv import load_dotenv
load_dotenv()

# ── Tool implementations (reused from Week 2) ─────────────────────────────────

def get_weather(city: str) -> str:
    """Fetch current weather for a city using Open-Meteo (no API key needed)."""
    # Step 1: geocode city name → lat/lon
    geo = httpx.get(
        "https://geocoding-api.open-meteo.com/v1/search",
        params={"name": city, "count": 1}
    ).json()

    if not geo.get("results"):
        return f"City '{city}' not found."

    lat = geo["results"][0]["latitude"]
    lon = geo["results"][0]["longitude"]

    # Step 2: fetch weather
    weather = httpx.get(
        "https://api.open-meteo.com/v1/forecast",
        params={
            "latitude": lat,
            "longitude": lon,
            "current_weather": True,
            "hourly": "relativehumidity_2m"
        }
    ).json()

    current = weather["current_weather"]
    humidity = weather["hourly"]["relativehumidity_2m"][0]

    return (
        f"Temperature: {current['temperature']}°C, "
        f"Wind: {current['windspeed']} km/h, "
        f"Humidity: {humidity}%, "
        f"Weathercode: {current['weathercode']}"
    )


def get_exchange_rate(from_currency: str, to_currency: str) -> str:
    """Fetch live exchange rate between two currencies via Frankfurter."""
    data = httpx.get(
        "https://api.frankfurter.dev/v1/latest",
        params={"from": from_currency, "to": to_currency}
    ).json()

    if "rates" not in data:
        return f"Could not fetch rate for {from_currency} → {to_currency}."

    rate = data["rates"][to_currency.upper()]
    return f"1 {from_currency.upper()} = {rate} {to_currency.upper()}"

# ── Tool definitions (what Claude sees) ───────────────────────────────────────

tools = [
    {
        "name": "get_weather",
        "description": "Get current weather for a city. Returns temperature, wind speed, humidity, and weather condition code.",
        "input_schema": {
            "type": "object",
            "properties": {
                "city": {
                    "type": "string",
                    "description": "The city name, e.g. Istanbul, Berlin, Tokyo"
                }
            },
            "required": ["city"]
        }
    },
    {
        "name": "get_exchange_rate",
        "description": "Get the live exchange rate between two currencies. Returns how much 1 unit of the source currency is worth in the target currency.",
        "input_schema": {
            "type": "object",
            "properties": {
                "from_currency": {
                    "type": "string",
                    "description": "The source currency code, e.g. USD, EUR, GBP"
                },
                "to_currency": {
                    "type": "string",
                    "description": "The target currency code, e.g. EUR, TRY, JPY"
                }
            },
            "required": ["from_currency", "to_currency"]
        }
    }
]

# ── Tool dispatcher ────────────────────────────────────────────────────────────

def run_tool(name: str, inputs: dict) -> str:
    if name == "get_weather":
        return get_weather(inputs["city"])
    if name == "get_exchange_rate":
        return get_exchange_rate(inputs["from_currency"], inputs["to_currency"])
    return f"Unknown tool: {name}"

# ── Main agent loop ────────────────────────────────────────────────────────────

client = anthropic.Anthropic()

def run_agent(user_query: str):
    print(f"\n{'='*60}")
    print(f"USER: {user_query}")
    print(f"{'='*60}")

    messages = [{"role": "user", "content": user_query}]
    turn = 0

    while True:
        turn += 1
        print(f"\n=== Turn {turn} ===")

        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            tools=tools,
            messages=messages
        )

        print(f"stop_reason: {response.stop_reason}")
        print("content blocks:")
        for i, block in enumerate(response.content):
            print(f"  [{i}] type={block.type}", end="")
            if block.type == "text":
                print(f" → {block.text[:80]}")
            elif block.type == "tool_use":
                print(f" → name={block.name}  inputs={block.input}")

        # Claude is done — print final answer and exit
        if response.stop_reason == "end_turn":
            print(f"\n{'='*60}")
            print("FINAL ANSWER:")
            for block in response.content:
                if block.type == "text":
                    print(block.text)
            break

        # Claude wants to call tools — execute them
        messages.append({"role": "assistant", "content": response.content})

        tool_results = []
        for block in response.content:
            if block.type == "tool_use":
                print(f"\n--- Executing: {block.name}({block.input}) ---")
                result = run_tool(block.name, block.input)
                print(f"Result: {result}")
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": result
                })

        messages.append({"role": "user", "content": tool_results})


# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    run_agent("What's the weather in Istanbul and how many euros is 100 USD?")