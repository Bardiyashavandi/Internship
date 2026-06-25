import httpx
import json
import sys
import time
import os
from anthropic import Anthropic, RateLimitError, APIError
from pydantic import BaseModel
from dotenv import load_dotenv

# Load .env file so ANTHROPIC_API_KEY is available as environment variable
load_dotenv()

# Initialize Claude client — automatically reads ANTHROPIC_API_KEY from environment
client = Anthropic()

# Define what a clean WeatherResult looks like
# Pydantic enforces these types — if Claude returns wrong types, it fails loudly here
class WeatherResult(BaseModel):
    city: str               # city name e.g. "Istanbul"
    temperature_c: float    # temperature in Celsius
    humidity_pct: int       # humidity as percentage 0-100
    wind_speed_kmh: float   # wind speed in km/h
    condition: str          # human readable e.g. "Clear sky"
    time: str               # local time of measurement

def call_with_retry(system: str, messages: list, max_retries: int = 3) -> str:
    """Call Claude with exponential backoff on rate limit errors."""
    for attempt in range(max_retries):
        try:
            response = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=256,
                system=system,
                messages=messages
            )
            return response.content[0].text
        except RateLimitError:
            # exponential backoff: wait 1s, then 2s, then 4s
            wait = 2 ** attempt
            print(f"Rate limited. Waiting {wait}s...")
            time.sleep(wait)
        except APIError as e:
            print(f"API error: {e}")
            raise
    raise RuntimeError("Max retries exceeded")

def get_coordinates(city: str) -> tuple[float, float]:
    """Convert city name to latitude and longitude."""
    url = "https://geocoding-api.open-meteo.com/v1/search"
    response = httpx.get(url, params={"name": city, "count": 1})
    response.raise_for_status()
    data = response.json()
    if not data.get("results"):
        raise ValueError(f"City not found: {city}")
    result = data["results"][0]
    return result["latitude"], result["longitude"]

def get_raw_weather(lat: float, lon: float) -> dict:
    """Fetch current weather data from Open-Meteo."""
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
        "timezone": "auto"
    }
    response = httpx.get(url, params=params)
    response.raise_for_status()
    return response.json()["current"]

def parse_weather(city: str, raw: dict) -> WeatherResult:
    """Use Claude to convert raw weather dict into a clean WeatherResult."""
    raw_json = call_with_retry(
        system="""You are a weather data parser.
Given raw weather data, return ONLY valid JSON matching this schema exactly:
{
  "city": str,
  "temperature_c": float,
  "humidity_pct": int,
  "wind_speed_kmh": float,
  "condition": str,
  "time": str
}
For condition, convert the weather_code to a human readable string.
Common codes: 0=Clear sky, 1=Mainly clear, 2=Partly cloudy, 3=Overcast,
45=Fog, 61=Rain, 71=Snow, 95=Thunderstorm.
Return ONLY JSON, no prose, no markdown.""",
        messages=[
    # Few-shot example — shows Claude exactly what output we want
    {
        "role": "user",
        "content": 'City: London\nRaw data: {"time": "2026-06-25T12:00", "temperature_2m": 18.5, "relative_humidity_2m": 65, "wind_speed_10m": 15.2, "weather_code": 3}'
    },
    {
        "role": "assistant",
        "content": '{"city": "London", "temperature_c": 18.5, "humidity_pct": 65, "wind_speed_kmh": 15.2, "condition": "Overcast", "time": "2026-06-25T12:00"}'
    },
    # The actual request
    {
        "role": "user",
        "content": f"City: {city}\nRaw data: {json.dumps(raw)}"
    }
]
    )
    return WeatherResult(**json.loads(raw_json))

def get_weather(city: str) -> WeatherResult:
    """Full pipeline: city name -> coordinates -> raw weather -> WeatherResult."""
    lat, lon = get_coordinates(city)
    raw = get_raw_weather(lat, lon)
    return parse_weather(city, raw)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python weather_agent.py <city>")
        sys.exit(1)

    city = sys.argv[1]

    try:
        result = get_weather(city)
        print(f"\nWeather in {result.city}:")
        print(f"  Temperature : {result.temperature_c}°C")
        print(f"  Condition   : {result.condition}")
        print(f"  Humidity    : {result.humidity_pct}%")
        print(f"  Wind speed  : {result.wind_speed_kmh} km/h")
        print(f"  Time        : {result.time}")
    except ValueError as e:
        # city not found
        print(f"Error: {e}")
        sys.exit(1)
    except httpx.HTTPError as e:
        # network or API issue
        print(f"Network error: {e}")
        sys.exit(1)
    except Exception as e:
        # anything unexpected
        print(f"Unexpected error: {e}")
        sys.exit(1)
import httpx
import json
import sys
import time
import os
from anthropic import Anthropic, RateLimitError, APIError
from pydantic import BaseModel
from dotenv import load_dotenv

# Load .env file so ANTHROPIC_API_KEY is available as environment variable
load_dotenv()

# Initialize Claude client — automatically reads ANTHROPIC_API_KEY from environment
client = Anthropic()

# Define what a clean WeatherResult looks like
# Pydantic enforces these types — if Claude returns wrong types, it fails loudly here
class WeatherResult(BaseModel):
    city: str               # city name e.g. "Istanbul"
    temperature_c: float    # temperature in Celsius
    humidity_pct: int       # humidity as percentage 0-100
    wind_speed_kmh: float   # wind speed in km/h
    condition: str          # human readable e.g. "Clear sky"
    time: str               # local time of measurement


def call_with_retry(system: str, messages: list, max_retries: int = 3) -> str:
    """Call Claude with exponential backoff on rate limit errors."""
    for attempt in range(max_retries):
        try:
            response = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=256,
                system=system,
                messages=messages
            )
            return response.content[0].text
        except RateLimitError:
            # exponential backoff: wait 1s, then 2s, then 4s
            wait = 2 ** attempt
            print(f"Rate limited. Waiting {wait}s...")
            time.sleep(wait)
        except APIError as e:
            print(f"API error: {e}")
            raise
    raise RuntimeError("Max retries exceeded")


def get_coordinates(city: str) -> tuple[float, float]:
    """Convert city name to latitude and longitude."""
    url = "https://geocoding-api.open-meteo.com/v1/search"
    response = httpx.get(url, params={"name": city, "count": 1})
    response.raise_for_status()
    data = response.json()

    # If no results found, city doesn't exist
    if not data.get("results"):
        raise ValueError(f"City not found: {city}")

    result = data["results"][0]
    return result["latitude"], result["longitude"]


def get_raw_weather(lat: float, lon: float) -> dict:
    """Fetch current weather data from Open-Meteo."""
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        # request only these specific weather metrics
        "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
        "timezone": "auto"  # detect timezone from coordinates automatically
    }
    response = httpx.get(url, params=params)
    response.raise_for_status()
    # only return the "current" part, not the full forecast object
    return response.json()["current"]


def parse_weather(city: str, raw: dict) -> WeatherResult:
    """Use Claude to convert raw weather dict into a clean WeatherResult."""
    raw_json = call_with_retry(
        system="""You are a weather data parser.
Given raw weather data, return ONLY valid JSON matching this schema exactly:
{
  "city": str,
  "temperature_c": float,
  "humidity_pct": int,
  "wind_speed_kmh": float,
  "condition": str,
  "time": str
}
For condition, convert the weather_code to a human readable string.
Common codes: 0=Clear sky, 1=Mainly clear, 2=Partly cloudy, 3=Overcast,
45=Fog, 61=Rain, 71=Snow, 95=Thunderstorm.
Return ONLY JSON, no prose, no markdown.""",
        messages=[
            # Few-shot example — shows Claude exactly what output we want
            {
                "role": "user",
                "content": 'City: London\nRaw data: {"time": "2026-06-25T12:00", "temperature_2m": 18.5, "relative_humidity_2m": 65, "wind_speed_10m": 15.2, "weather_code": 3}'
            },
            {
                "role": "assistant",
                "content": '{"city": "London", "temperature_c": 18.5, "humidity_pct": 65, "wind_speed_kmh": 15.2, "condition": "Overcast", "time": "2026-06-25T12:00"}'
            },
            # The actual request
            {
                "role": "user",
                "content": f"City: {city}\nRaw data: {json.dumps(raw)}"
            }
        ]
    )
    # parse JSON string into WeatherResult — Pydantic validates all fields here
    return WeatherResult(**json.loads(raw_json))


def stream_weather_summary(city: str) -> None:
    """Stream a conversational weather summary for a city."""
    lat, lon = get_coordinates(city)
    raw = get_raw_weather(lat, lon)

    with client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=256,
        system="You are a friendly weather reporter. Give a short conversational summary of the weather.",
        messages=[{
            "role": "user",
            "content": f"Give me a weather summary for {city}. Raw data: {json.dumps(raw)}"
        }]
    ) as stream:
        print(f"\n🌤️ Weather summary for {city}:")
        for text in stream.text_stream:
            print(text, end="", flush=True)
        print("\n")


def get_weather(city: str) -> WeatherResult:
    """Full pipeline: city name -> coordinates -> raw weather -> WeatherResult."""
    lat, lon = get_coordinates(city)
    raw = get_raw_weather(lat, lon)
    return parse_weather(city, raw)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python weather_agent.py <city>")
        sys.exit(1)

    city = sys.argv[1]

    try:
        # Structured output
        result = get_weather(city)
        print(f"\nWeather in {result.city}:")
        print(f"  Temperature : {result.temperature_c}°C")
        print(f"  Condition   : {result.condition}")
        print(f"  Humidity    : {result.humidity_pct}%")
        print(f"  Wind speed  : {result.wind_speed_kmh} km/h")
        print(f"  Time        : {result.time}")

        # Streaming summary
        stream_weather_summary(city)

    except ValueError as e:
        # city not found
        print(f"Error: {e}")
        sys.exit(1)
    except httpx.HTTPError as e:
        # network or API issue
        print(f"Network error: {e}")
        sys.exit(1)
    except Exception as e:
        # anything unexpected
        print(f"Unexpected error: {e}")
        sys.exit(1)