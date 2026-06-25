# Spec: Open-Meteo Weather Fetcher

## Problem
The agent needs live weather data for any city without requiring an API key.

## Inputs & Outputs
- Input: city_name: str — e.g. "Istanbul"
- Output: dict with keys: time, temperature_2m, relative_humidity_2m, wind_speed_10m, weather_code

## Behavior
- Call Open-Meteo geocoding API to convert city name to lat/lon
- Call Open-Meteo forecast API with those coordinates
- Return only the "current" block from the response

## Non-Goals
- No forecasts (current conditions only)
- No unit conversion (metric only)
- No caching

## Acceptance Criteria
- [ ] Returns correct coordinates for Istanbul
- [ ] Returns current weather dict with all 4 metrics
- [ ] Raises ValueError with "City not found: <city>" for invalid city
- [ ] Raises httpx.HTTPError on network failure

---