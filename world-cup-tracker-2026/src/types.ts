export interface Team {
  name: string;
  code: string;
  flagEmoji: string;
  colors: {
    primary: string;    // CSS background class/color
    secondary: string;  // accent
    text: string;
  };
}

export interface MatchScorer {
  name: string;
  min: number;
  teamCode: string;
}

export interface MatchEvent {
  id: string;
  type: 'goal' | 'yellow_card' | 'red_card' | 'shot' | 'corner' | 'foul';
  min: number;
  description: string;
  teamCode?: string;
  playerName?: string;
}

export interface Match {
  id: string;
  teamA: Team;
  teamB: Team;
  scoreA: number;
  scoreB: number;
  status: 'LIVE' | 'HALF_TIME' | 'FULL_TIME';
  minute: number;
  group: string;
  stadium: string;
  possession: [number, number]; // Percentages
  shots: [number, number];      // [Team A, Team B]
  fouls: [number, number];
  yellowCards: [number, number];
  redCards: [number, number];
  scorers: MatchScorer[];
  events: MatchEvent[];
}
