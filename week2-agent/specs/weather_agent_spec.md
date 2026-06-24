# Spec: Weather Agent

## Problem
A user asks a natural language weather question and the agent responds with current weather data for the requested city.

## Inputs & Outputs
- Input: a natural language string e.g. "What's the weather in Istanbul?"
- Output: WeatherResult(city: str, temp_c: float, humidity_pct: int, wind_speed: float, condition: str)

## Behavior
- Extract the city name from the user's natural language question
- Call Open-Meteo API to get current weather data for that city
- Return a structured WeatherResult with all metrics
- If the city does not exist or is not found, respond with "City not found"

## Non-Goals
- No weather forecasts (current conditions only)
- No responses to questions unrelated to weather
- No unit conversion (Celsius only)

## Acceptance Criteria
- [ ] Returns correct temperature and metrics for Istanbul
- [ ] Returns "City not found" for a made-up city
- [ ] Ignores non-weather questions e.g. "What's the capital of France?"
- [ ] Response time under 3 seconds on normal network
