
# Spec: Claude Weather Parser

## Problem
Open-Meteo returns raw field names (temperature_2m) and numeric weather codes (0, 3, 61).
We need clean human-readable structured output.

## Inputs & Outputs
- Input: city: str, raw: dict (from Open-Meteo)
- Output: WeatherResult(city: str, temperature_c: float, humidity_pct: int, wind_speed_kmh: float, condition: str, time: str)

## Behavior
- Send raw weather dict to Claude with a structured output system prompt
- Include one few-shot example to lock in output format
- Claude converts weather_code to human readable condition (e.g. 0 → "Clear sky")
- Claude renames fields to match WeatherResult schema
- Parse Claude's JSON response into a WeatherResult Pydantic model

## Non-Goals
- No fallback condition mapping (Claude handles all codes)
- No temperature conversion (Celsius only)

## Acceptance Criteria
- [ ] Returns WeatherResult with correct types for all fields
- [ ] Converts weather_code 0 to "Clear sky"
- [ ] Converts weather_code 3 to "Overcast"
- [ ] Raises ValidationError if Claude returns wrong schema
- [ ] Retries up to 3 times on RateLimitError with exponential backoff

---