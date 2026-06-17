import { Match, Team } from './types';

export const TEAMS: Record<string, Team> = {
  BRA: {
    name: 'Brazil',
    code: 'BRA',
    flagEmoji: '🇧🇷',
    colors: {
      primary: '#FCD116', // Yellow
      secondary: '#009739', // Green
      text: '#002F6C',
    },
  },
  ARG: {
    name: 'Argentina',
    code: 'ARG',
    flagEmoji: '🇦🇷',
    colors: {
      primary: '#75AADB', // Light Blue
      secondary: '#FFFFFF', // White
      text: '#222222',
    },
  },
  FRA: {
    name: 'France',
    code: 'FRA',
    flagEmoji: '🇫🇷',
    colors: {
      primary: '#002395', // Navy
      secondary: '#ED2939', // Red
      text: '#FFFFFF',
    },
  },
  ENG: {
    name: 'England',
    code: 'ENG',
    flagEmoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    colors: {
      primary: '#FFFFFF', // White
      secondary: '#CD1024', // Red
      text: '#0A192F',
    },
  },
  MAR: {
    name: 'Morocco',
    code: 'MAR',
    flagEmoji: '🇲🇦',
    colors: {
      primary: '#C1272D', // Red
      secondary: '#006233', // Green
      text: '#FFFFFF',
    },
  },
  USA: {
    name: 'United States',
    code: 'USA',
    flagEmoji: '🇺🇸',
    colors: {
      primary: '#002868', // Dark Blue
      secondary: '#BF0A30', // Red
      text: '#FFFFFF',
    },
  },
};

// Squas names for immersive events
export const PLAYERS: Record<string, string[]> = {
  BRA: ['Vinícius Júnior', 'Rodrygo', 'Raphinha', 'Bruno Guimarães', 'Lucas Paquetá', 'Marquinhos', 'Gabriel Martinelli'],
  ARG: ['Lionel Messi', 'Lautaro Martínez', 'Julián Álvarez', 'Alexis Mac Allister', 'Rodrigo de Paul', 'Enzo Fernández'],
  FRA: ['Kylian Mbappé', 'Antoine Griezmann', 'Ousmane Dembélé', 'Aurélien Tchouaméni', 'Eduardo Camavinga', 'William Saliba'],
  ENG: ['Harry Kane', 'Jude Bellingham', 'Bukayo Saka', 'Phil Foden', 'Declan Rice', 'Cole Palmer', 'John Stones'],
  MAR: ['Hakim Ziyech', 'Youssef En-Nesyri', 'Achraf Hakimi', 'Sofyan Amrabat', 'Azzedine Ounahi', 'Brahim Díaz'],
  USA: ['Christian Pulisic', 'Folarin Balogun', 'Timothy Weah', 'Weston McKennie', 'Tyler Adams', 'Yunus Musah'],
};

export const INITIAL_MATCHES: Match[] = [
  {
    id: 'm1',
    teamA: TEAMS.BRA,
    teamB: TEAMS.ARG,
    scoreA: 2,
    scoreB: 1,
    status: 'LIVE',
    minute: 74,
    group: 'Group A',
    stadium: 'Estadio Azteca, Mexico City',
    possession: [54, 46],
    shots: [12, 9],
    fouls: [8, 11],
    yellowCards: [1, 2],
    redCards: [0, 0],
    scorers: [
      { name: 'Vinícius Júnior', min: 14, teamCode: 'BRA' },
      { name: 'Lionel Messi', min: 42, teamCode: 'ARG' },
      { name: 'Rodrygo', min: 61, teamCode: 'BRA' },
    ],
    events: [
      { id: 'e1', type: 'goal', min: 14, description: 'GOAL! Vinícius Júnior scores with a stunning volley top-corner!', teamCode: 'BRA', playerName: 'Vinícius Júnior' },
      { id: 'e2', type: 'yellow_card', min: 28, description: 'Yellow Card: Rodrigo de Paul (ARG)', teamCode: 'ARG', playerName: 'Rodrigo de Paul' },
      { id: 'e3', type: 'goal', min: 42, description: 'GOAL! Lionel Messi converts a beautiful free-kick over the wall!', teamCode: 'ARG', playerName: 'Lionel Messi' },
      { id: 'e4', type: 'foul', min: 45, description: 'Foul committed by Bruno Guimarães (BRA) near half-field.', teamCode: 'BRA' },
      { id: 'e5', type: 'goal', min: 61, description: 'GOAL! Rodrygo taps in from close range after a rebound!', teamCode: 'BRA', playerName: 'Rodrygo' },
    ],
  },
  {
    id: 'm2',
    teamA: TEAMS.FRA,
    teamB: TEAMS.ENG,
    scoreA: 0,
    scoreB: 0,
    status: 'LIVE',
    minute: 12,
    group: 'Group C',
    stadium: 'MetLife Stadium, New York / New Jersey',
    possession: [48, 52],
    shots: [2, 3],
    fouls: [3, 2],
    yellowCards: [0, 0],
    redCards: [0, 0],
    scorers: [],
    events: [
      { id: 'f1', type: 'shot', min: 4, description: 'Shot missed: Bukayo Saka (ENG) drills a powerful shot wide left.', teamCode: 'ENG' },
      { id: 'f2', type: 'corner', min: 8, description: 'Corner kick awarded to France after a clearance by John Stones.', teamCode: 'FRA' },
    ],
  },
  {
    id: 'm3',
    teamA: TEAMS.MAR,
    teamB: TEAMS.USA,
    scoreA: 2,
    scoreB: 2,
    status: 'FULL_TIME',
    minute: 90,
    group: 'Group F',
    stadium: 'SoFi Stadium, Los Angeles',
    possession: [50, 50],
    shots: [14, 15],
    fouls: [10, 9],
    yellowCards: [2, 1],
    redCards: [0, 0],
    scorers: [
      { name: 'Christian Pulisic', min: 18, teamCode: 'USA' },
      { name: 'Brahim Díaz', min: 39, teamCode: 'MAR' },
      { name: 'Youssef En-Nesyri', min: 55, teamCode: 'MAR' },
      { name: 'Folarin Balogun', min: 82, teamCode: 'USA' },
    ],
    events: [
      { id: 'u1', type: 'goal', min: 18, description: 'GOAL! Christian Pulisic slots it home coolly into the corner.', teamCode: 'USA', playerName: 'Christian Pulisic' },
      { id: 'u2', type: 'goal', min: 39, description: 'GOAL! Brahim Díaz finishes a superb solo run through the defense.', teamCode: 'MAR', playerName: 'Brahim Díaz' },
      { id: 'u3', type: 'yellow_card', min: 44, description: 'Yellow Card: Sofyan Amrabat (MAR)', teamCode: 'MAR', playerName: 'Sofyan Amrabat' },
      { id: 'u4', type: 'goal', min: 55, description: 'GOAL! Youssef En-Nesyri headers in from a pin-point corner!', teamCode: 'MAR', playerName: 'Youssef En-Nesyri' },
      { id: 'u5', type: 'yellow_card', min: 70, description: 'Yellow Card: Tyler Adams (USA)', teamCode: 'USA', playerName: 'Tyler Adams' },
      { id: 'u6', type: 'goal', min: 82, description: 'GOAL! Folarin Balogun levels the score with a stunning header!', teamCode: 'USA', playerName: 'Folarin Balogun' },
    ],
  },
];
