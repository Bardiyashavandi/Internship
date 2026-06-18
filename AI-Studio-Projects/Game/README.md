# World Cup Tracker 2026

A browser-based, single-page dashboard for following World Cup 2026 matches. Built with React, TypeScript, and Vite, and originally scaffolded in Google AI Studio.

## What It Does

The app preloads a set of World Cup fixtures and lets the user track them as if they were live:

- **Live auto-simulation** — a timer advances the match clock and randomly generates goals, shots, corners, fouls, and yellow cards, complete with crowd-cheer/whistle sound effects and confetti on goals.
- **Manual controls** — users can trigger a goal for either team, change a match's status (Live / Half-Time / Full-Time), or set the clock by hand.
- **Custom fixtures** — a modal lets users create new matches between any two teams from the built-in roster.
- **Standings, stats, and event log** — a league standings table, shot/foul/possession breakdowns, and a chronological feed of match events update live alongside the simulation.
- **Search and filtering** — fixtures can be filtered by status or searched by team name, code, or group.
- State is saved to the browser's local storage, so the tracker persists between page reloads.

## Tech Stack

- React 19 + TypeScript
- Vite 6 (build tool / dev server)
- Tailwind CSS 4
- `motion` (Framer Motion) for animations, `canvas-confetti` for goal celebrations, `lucide-react` for icons
- `@google/genai` is included as a dependency but is not currently used by the UI logic

## Project Structure

```
Game/
├── src/
│   ├── App.tsx               # Main app: state, simulation engine, layout
│   ├── data.ts                # Team rosters and preloaded fixtures
│   ├── types.ts                # Shared TypeScript types (Match, Team, etc.)
│   └── components/
│       ├── StadiumField.tsx    # Tactical view / quick-action panel for the selected match
│       ├── StandingsTable.tsx  # Computed league standings
│       ├── GoalOverlay.tsx     # Full-screen goal celebration animation
│       └── AudioEngine.ts      # Whistle and crowd-cheer sound effects
├── package.json
└── vite.config.ts
```

## Running Locally

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. (Optional) Set `GEMINI_API_KEY` in `.env.local` if Gemini features are added later — not required for the current UI
3. Start the dev server: `npm run dev`
4. Build for production: `npm run build`

## Status

Functional demo/prototype. All match data is simulated client-side; there is no backend or live sports data feed.
