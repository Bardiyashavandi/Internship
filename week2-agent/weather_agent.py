import httpx        # HTTP client for calling external APIs
import json         # for parsing and serializing JSON
import os           # for reading environment variables
from anthropic import Anthropic   # Claude API client
from pydantic import BaseModel    # for defining typed data models
from dotenv import load_dotenv    # for loading .env file

# Load .env file so ANTHROPIC_API_KEY is available as environment variable
load_dotenv()

# Initialize Claude client — automatically reads ANTHROPIC_API_KEY from environment
client = Anthropic()

# Step 1: Define what a clean WeatherResult looks like
# Pydantic enforces these types — if Claude returns wrong types, it fails loudly here
class WeatherResult(BaseModel):
    city: str               # city name e.g. "Istanbul"
    temperature_c: float    # temperature in Celsius
    humidity_pct: int       # humidity as percentage 0-100
    wind_speed_kmh: float   # wind speed in km/h
    condition: str          # human readable e.g. "Clear sky"
    time: str               # local time of measurement

# Step 2: Convert city name to coordinates
# Open-Meteo weather API needs lat/lon, not city name
def get_coordinates(city: str) -> tuple[float, float]:
    url = "https://geocoding-api.open-meteo.com/v1/search"
    response = httpx.get(url, params={"name": city, "count": 1})
    response.raise_for_status()  # raises error if request failed
    data = response.json()

    # If no results found, city doesn't exist
    if not data.get("results"):
        raise ValueError(f"City not found: {city}")

    result = data["results"][0]
    return result["latitude"], result["longitude"]

# Step 3: Fetch raw weather data using coordinates
def get_raw_weather(lat: float, lon: float) -> dict:
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

# Step 4: Use Claude to parse raw data into a clean WeatherResult
# Claude handles two things here:
# 1. Converting weather_code number to human readable condition
# 2. Renaming fields to match our schema (temperature_2m -> temperature_c etc.)
def parse_weather(city: str, raw: dict) -> WeatherResult:
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=256,
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
        messages=[{
            "role": "user",
            # send both city name and raw weather data to Claude
            "content": f"City: {city}\nRaw data: {json.dumps(raw)}"
        }]
    )
    # extract the text response from Claude
    raw_json = response.content[0].text

    # parse JSON string into a WeatherResult Pydantic model
    # Pydantic validates all fields here — wrong types will raise an error
    return WeatherResult(**json.loads(raw_json))

# Step 5: Wire everything together into one clean function
# This is the only function the outside world needs to call
def get_weather(city: str) -> WeatherResult:
    lat, lon = get_coordinates(city)   # city name -> coordinates
    raw = get_raw_weather(lat, lon)    # coordinates -> raw weather dict
    return parse_weather(city, raw)    # raw dict -> clean WeatherResult

# Test the full pipeline
result = get_weather("Istanbul")
print(result)
