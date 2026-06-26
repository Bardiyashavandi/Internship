# Spec: get_weather Tool

## Problem
The agent needs current weather data for any city to answer weather-related questions.

## Inputs & Outputs
- Input: city: str — e.g. "Istanbul"
- Output: dict with keys: time, temperature_2m, relative_humidity_2m, wind_speed_10m, weather_code

## Behavior
- Call Open-Meteo geocoding API to convert city name to lat/lon
- Call Open-Meteo forecast API with those coordinates
- Return only the "current" block from the response
- If city not found, return {"error": "City not found: <city>"}

## Non-Goals
- No forecasts (current conditions only)
- No unit conversion (metric only)
- No human-readable condition (raw weather_code only)

## Acceptance Criteria
- [ ] Returns correct weather dict for Istanbul
- [ ] Returns error dict for fake city without crashing
- [ ] Returns all 4 metrics: temperature, humidity, wind speed, weather code

---

# Spec: get_exchange_rate Tool

## Problem
The agent needs current exchange rates to answer currency conversion questions.

## Inputs & Outputs
- Input: from_currency: str, to_currency: str — e.g. "USD", "EUR"
- Output: dict with keys: amount, base, date, rates

## Behavior
- Call Frankfurter API with from and to currency params
- Return the full response JSON including rate and date

## Non-Goals
- No conversion calculation (returns rate only, agent does the math)
- No historical rates (latest only)
- No multiple target currencies

## Acceptance Criteria
- [ ] Returns correct rate for USD to EUR
- [ ] Returns correct rate for EUR to TRY
- [ ] Raises httpx.HTTPError on network failure