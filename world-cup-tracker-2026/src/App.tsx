import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Play, 
  Pause, 
  RefreshCw, 
  Plus, 
  Search, 
  Radio, 
  Clock, 
  Activity, 
  Trash2, 
  ChevronRight, 
  Volume2, 
  VolumeX, 
  Gamepad2, 
  Eye, 
  HelpCircle 
} from 'lucide-react';

import { Match, Team, MatchEvent } from './types';
import { INITIAL_MATCHES, TEAMS, PLAYERS } from './data';
import { playWhistle, playCrowdCheer } from './components/AudioEngine';
import { GoalOverlay } from './components/GoalOverlay';
import { StandingsTable } from './components/StandingsTable';
import { StadiumField } from './components/StadiumField';

export default function App() {
  // --- Match and App States ---
  const [matches, setMatches] = useState<Match[]>(() => {
    const saved = localStorage.getItem('wc_2026_tracker_matches');
    return saved ? JSON.parse(saved) : INITIAL_MATCHES;
  });
  
  const [selectedMatchId, setSelectedMatchId] = useState<string>( INITIAL_MATCHES[0].id );
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LIVE' | 'HALF_TIME' | 'FULL_TIME'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Custom match creation state
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [addHomeCode, setAddHomeCode] = useState<string>('MEX');
  const [addAwayCode, setAddAwayCode] = useState<string>('GER');
  const [addStatus, setAddStatus] = useState<'LIVE' | 'HALF_TIME' | 'FULL_TIME'>('LIVE');
  const [addMinute, setAddMinute] = useState<number>(0);
  const [addGroup, setAddGroup] = useState<string>('Group B');

  // Goal celebration overlay state
  const [celebration, setCelebration] = useState<{
    isVisible: boolean;
    scoringTeam: Team | null;
    playerName: string;
  }>({
    isVisible: false,
    scoringTeam: null,
    playerName: '',
  });

  // Save matches state to localStorage
  useEffect(() => {
    localStorage.setItem('wc_2026_tracker_matches', JSON.stringify(matches));
  }, [matches]);

  // Selected Match Object
  const selectedMatch = useMemo(() => {
    return matches.find((m) => m.id === selectedMatchId) || matches[0];
  }, [matches, selectedMatchId]);

  // --- Real-time match simulation engine ---
  useEffect(() => {
    if (!isSimulating) return;

    if (soundEnabled) {
      playWhistle();
    }

    const interval = setInterval(() => {
      setMatches((prevMatches) => {
        return prevMatches.map((match) => {
          if (match.status !== 'LIVE') return match;

          // Increment game time
          const nextMinute = match.minute + 1;
          let nextStatus = match.status;

          if (nextMinute >= 90) {
            nextStatus = 'FULL_TIME';
            if (soundEnabled) {
              // Final whistle double blast
              setTimeout(() => playWhistle(), 100);
            }
          }

          // Random incident probability (roughly ~15% chance per clock tick)
          const rand = Math.random();
          let scoreA = match.scoreA;
          let scoreB = match.scoreB;
          const scorers = [...match.scorers];
          const events = [...match.events];
          const possession = [...match.possession] as [number, number];
          const shots = [...match.shots] as [number, number];
          const fouls = [...match.fouls] as [number, number];
          const yellowCards = [...match.yellowCards] as [number, number];

          // Slowly tilt possession percentages slightly toward reality
          possession[0] = Math.min(78, Math.max(22, possession[0] + (Math.random() > 0.5 ? 2 : -2)));
          possession[1] = 100 - possession[0];

          if (rand < 0.16) {
            // Trigger incident
            const isTeamA = Math.random() > 0.5;
            const scoringTeamObj = isTeamA ? match.teamA : match.teamB;
            const defendingTeamObj = isTeamA ? match.teamB : match.teamA;
            const code = scoringTeamObj.code;

            // Decide standard soccer incident type
            const outcomeRand = Math.random();
            let eventType: 'goal' | 'yellow_card' | 'shot' | 'corner' | 'foul' = 'shot';

            if (outcomeRand < 0.12) {
              eventType = 'goal';
            } else if (outcomeRand < 0.40) {
              eventType = 'shot';
            } else if (outcomeRand < 0.60) {
              eventType = 'corner';
            } else if (outcomeRand < 0.85) {
              eventType = 'foul';
            } else {
              eventType = 'yellow_card';
            }

            const playerPool = PLAYERS[code] || ['Superstar'];
            const randomPlayer = playerPool[Math.floor(Math.random() * playerPool.length)];

            if (eventType === 'goal') {
              if (isTeamA) {
                scoreA += 1;
              } else {
                scoreB += 1;
              }

              // Record goal scorer
              scorers.push({ name: randomPlayer, min: nextMinute, teamCode: code });
              
              const desc = `GOAL! ${randomPlayer} scores a magnificent strike for ${scoringTeamObj.name}! ⚽`;
              events.unshift({
                id: `ev-${Date.now()}-${code}`,
                type: 'goal',
                min: nextMinute,
                description: desc,
                teamCode: code,
                playerName: randomPlayer,
              });

              // Trigger immediate visual/audio effects
              if (soundEnabled) {
                playCrowdCheer(true);
              }
              
              // Trigger confetti explosions
              confetti({
                particleCount: 140,
                spread: 90,
                origin: { y: 0.6 }
              });

              setCelebration({
                isVisible: true,
                scoringTeam: scoringTeamObj,
                playerName: randomPlayer,
              });

            } else if (eventType === 'shot') {
              if (isTeamA) shots[0]++; else shots[1]++;
              events.unshift({
                id: `ev-${Date.now()}-${code}`,
                type: 'shot',
                min: nextMinute,
                description: `Shot missed! ${randomPlayer} (${scoringTeamObj.name}) drills a powerful shot over the crossbar.`,
                teamCode: code,
                playerName: randomPlayer,
              });
            } else if (eventType === 'corner') {
              events.unshift({
                id: `ev-${Date.now()}-${code}`,
                type: 'corner',
                min: nextMinute,
                description: `Corner kick awarded to ${scoringTeamObj.name} after a tactical tackle by ${defendingTeamObj.name}.`,
                teamCode: code,
              });
            } else if (eventType === 'foul') {
              if (isTeamA) fouls[0]++; else fouls[1]++;
              events.unshift({
                id: `ev-${Date.now()}-${code}`,
                type: 'foul',
                min: nextMinute,
                description: `Match whistle: Foul committed by ${scoringTeamObj.name} holding off midfield attack.`,
                teamCode: code,
              });
            } else if (eventType === 'yellow_card') {
              if (isTeamA) yellowCards[0]++; else yellowCards[1]++;
              events.unshift({
                id: `ev-${Date.now()}-${code}`,
                type: 'yellow_card',
                min: nextMinute,
                description: `Yellow Card 🟨: ${randomPlayer} (${scoringTeamObj.name}) penalized for a slide tackle.`,
                teamCode: code,
                playerName: randomPlayer,
              });
            }
          }

          return {
            ...match,
            minute: nextMinute,
            status: nextStatus,
            scoreA,
            scoreB,
            scorers,
            events,
            possession,
            shots,
            fouls,
            yellowCards,
          };
        });
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [isSimulating, soundEnabled]);

  // --- Manual Goal click celebration ---
  const handleManualGoal = (matchId: string, teamNum: 'A' | 'B') => {
    setMatches((prevMatches) => {
      return prevMatches.map((m) => {
        if (m.id !== matchId) return m;

        const nextMinute = m.status === 'FULL_TIME' ? 90 : m.minute;
        let scoreA = m.scoreA;
        let scoreB = m.scoreB;
        const targetTeam = teamNum === 'A' ? m.teamA : m.teamB;

        if (teamNum === 'A') {
          scoreA += 1;
        } else {
          scoreB += 1;
        }

        const playerPool = PLAYERS[targetTeam.code] || ['Team Star'];
        const playerName = playerPool[Math.floor(Math.random() * playerPool.length)];

        const newScorers = [...m.scorers, { name: playerName, min: nextMinute, teamCode: targetTeam.code }];
        const newEvents = [
          {
            id: `manual-goal-${Date.now()}`,
            type: 'goal' as const,
            min: nextMinute,
            description: `GOAL! Spectacular team effort finished cleanly by ${playerName} (${targetTeam.name})! ⚽🔥`,
            teamCode: targetTeam.code,
            playerName,
          },
          ...m.events,
        ];

        // Core sound cheer and confetti triggers
        if (soundEnabled) {
          playCrowdCheer(true);
        }
        
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.55 },
          colors: [targetTeam.colors.primary, targetTeam.colors.secondary, '#ffffff', '#ffd700']
        });

        setCelebration({
          isVisible: true,
          scoringTeam: targetTeam,
          playerName,
        });

        // Add interesting tactical stats increment
        const nextShots = [...m.shots] as [number, number];
        if (teamNum === 'A') nextShots[0]++; else nextShots[1]++;

        return {
          ...m,
          scoreA,
          scoreB,
          scorers: newScorers,
          events: newEvents,
          shots: nextShots,
        };
      });
    });
  };

  // --- Quick Individual Incident Simulation Triggered from Pitch board ---
  const handleSimulateIncidentObj = (type: 'shot' | 'corner' | 'foul' | 'yellow_card', teamCode: string) => {
    setMatches((prevMatches) => {
      return prevMatches.map((m) => {
        if (m.id !== selectedMatchId) return m;

        const isTeamA = m.teamA.code === teamCode;
        const currentM = m.minute;
        const activeTeam = isTeamA ? m.teamA : m.teamB;
        const playerPool = PLAYERS[teamCode] || ['Substitute'];
        const randomPlayer = playerPool[Math.floor(Math.random() * playerPool.length)];

        const nextShots = [...m.shots] as [number, number];
        const nextFouls = [...m.fouls] as [number, number];
        const nextYellows = [...m.yellowCards] as [number, number];
        const nextEvents = [...m.events];

        if (soundEnabled && type === 'foul') {
          playWhistle();
        }

        let desc = '';
        if (type === 'shot') {
          if (isTeamA) nextShots[0]++; else nextShots[1]++;
          desc = `Dangerous strike! ${randomPlayer} (${activeTeam.name}) releases an absolute rocket but it sails inches wide!`;
        } else if (type === 'corner') {
          desc = `Set piece! ${activeTeam.name} wins a crucial corner in the box.`;
        } else if (type === 'foul') {
          if (isTeamA) nextFouls[0]++; else nextFouls[1]++;
          desc = `Dangerous charge! Referee awards a direct free-kick against ${activeTeam.name}.`;
        } else if (type === 'yellow_card') {
          if (isTeamA) nextYellows[0]++; else nextYellows[1]++;
          desc = `Booking 🟨: Yellow card shown to ${randomPlayer} (${activeTeam.name}) for defensive blocking.`;
        }

        nextEvents.unshift({
          id: `manual-incident-${Date.now()}`,
          type,
          min: currentM,
          description: desc,
          teamCode,
          playerName: randomPlayer,
        });

        return {
          ...m,
          shots: nextShots,
          fouls: nextFouls,
          yellowCards: nextYellows,
          events: nextEvents,
        };
      });
    });
  };

  // --- Change Match Status ---
  const handleStatusChange = (matchId: string, nextStatus: 'LIVE' | 'HALF_TIME' | 'FULL_TIME') => {
    setMatches((prevMatches) => {
      return prevMatches.map((m) => {
        if (m.id !== matchId) return m;

        if (soundEnabled) {
          playWhistle();
        }

        const events = [...m.events];
        let desc = '';
        if (nextStatus === 'LIVE') {
          desc = `Match is underway! Whistle blows for the active segment.`;
        } else if (nextStatus === 'HALF_TIME') {
          desc = `Half-Time whistle! Teams head to the lockers to refine tactics.`;
        } else if (nextStatus === 'FULL_TIME') {
          desc = `Full-time whistle! The match concludes. Epic battle! 🏁`;
        }

        events.unshift({
          id: `status-change-${Date.now()}`,
          type: 'foul', // standard whistling icon
          min: m.minute,
          description: desc,
        });

        return {
          ...m,
          status: nextStatus,
          events,
        };
      });
    });
  };

  // --- Change Match Minute manually ---
  const handleMinuteChange = (matchId: string, val: number) => {
    setMatches((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, minute: Math.max(0, Math.min(90, val)) } : m))
    );
  };

  // --- Reset matches to initial state ---
  const handleResetMatches = () => {
    if (confirm('Are you sure you want to reset all scores, standing tables, and live events to default?')) {
      setMatches(INITIAL_MATCHES);
      setSelectedMatchId(INITIAL_MATCHES[0].id);
      setIsSimulating(false);
      if (soundEnabled) {
        playWhistle();
      }
    }
  };

  // --- Delete match ---
  const handleDeleteMatch = (matchId: string) => {
    if (matches.length <= 1) {
      alert('Must keep at least 1 match pre-loaded in the tracker.');
      return;
    }
    const filtered = matches.filter((m) => m.id !== matchId);
    setMatches(filtered);
    if (selectedMatchId === matchId) {
      setSelectedMatchId(filtered[0].id);
    }
  };

  // --- Support full custom teams for Match Creator ---
  // A clean expanded repository of major teams in general World Cup pool with beautiful custom styling
  const DETAILED_SQUADS = {
    MEX: { name: 'Mexico', code: 'MEX', flagEmoji: '🇲🇽', colors: { primary: '#006341', secondary: '#C8102E', text: '#FFFFFF' } },
    GER: { name: 'Germany', code: 'GER', flagEmoji: '🇩🇪', colors: { primary: '#FFFFFF', secondary: '#FFCC00', text: '#0A0A0A' } },
    ITA: { name: 'Italy', code: 'ITA', flagEmoji: '🇮🇹', colors: { primary: '#0066BC', secondary: '#FFFFFF', text: '#FFFFFF' } },
    JPN: { name: 'Japan', code: 'JPN', flagEmoji: '🇯🇵', colors: { primary: '#002E73', secondary: '#FFFFFF', text: '#FFFFFF' } },
    ESP: { name: 'Spain', code: 'ESP', flagEmoji: '🇪🇸', colors: { primary: '#C1272D', secondary: '#FCD116', text: '#FFFFFF' } },
  };

  // All eligible teams including the original TEAMS
  const ALL_TEAM_CHOICES = { ...TEAMS, ...DETAILED_SQUADS };

  // --- Add a new Custom Match ---
  const handleCreateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (addHomeCode === addAwayCode) {
      alert('Home team and Away team must be distinct!');
      return;
    }

    const homeTeam = ALL_TEAM_CHOICES[addHomeCode];
    const awayTeam = ALL_TEAM_CHOICES[addAwayCode];

    const newMatch: Match = {
      id: `custom-match-${Date.now()}`,
      teamA: homeTeam,
      teamB: awayTeam,
      scoreA: 0,
      scoreB: 0,
      status: addStatus,
      minute: addMinute,
      group: addGroup,
      stadium: 'Lusail Iconic Stadium (Simulated)',
      possession: [50, 50],
      shots: [0, 0],
      fouls: [0, 0],
      yellowCards: [0, 0],
      redCards: [0, 0],
      scorers: [],
      events: [
        {
          id: `init-${Date.now()}`,
          type: 'corner',
          min: addMinute,
          description: `Kickoff! Beautiful custom match created: ${homeTeam.name} vs ${awayTeam.name}.`,
        },
      ],
    };

    setMatches((prev) => [...prev, newMatch]);
    setSelectedMatchId(newMatch.id);
    setIsAddOpen(false);
    
    if (soundEnabled) {
      playWhistle();
    }
  };

  // --- Filtering & Searching logic ---
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      // Filter by Status
      if (statusFilter !== 'ALL' && m.status !== statusFilter) {
        return false;
      }
      // Search by Country Name or Code
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesName = 
          m.teamA.name.toLowerCase().includes(query) || 
          m.teamB.name.toLowerCase().includes(query) ||
          m.teamA.code.toLowerCase().includes(query) ||
          m.teamB.code.toLowerCase().includes(query) ||
          m.group.toLowerCase().includes(query);
        return matchesName;
      }
      return true;
    });
  }, [matches, statusFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white pb-16">
      
      {/* Visual Header / Command Center bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-white/5 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/20">
              <Trophy className="text-slate-950" size={22} strokeWidth={2.5} />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black text-emerald-400 uppercase tracking-widest bg-emerald-900/30 px-2 py-0.5 rounded">
                  FIFA 2026
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Live Sim Active
                </span>
              </div>
              <h1 className="text-lg font-black tracking-tight text-white leading-tight">
                World Cup Tracker
              </h1>
            </div>
          </div>

          {/* Quick Header actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Simulation Engine Toggle */}
            <button
              id="sim-engine-toggle"
              onClick={() => setIsSimulating(!isSimulating)}
              className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition active:scale-95 shadow-md ${
                isSimulating 
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/10' 
                  : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold shadow-emerald-500/10'
              }`}
            >
              {isSimulating ? (
                <>
                  <Pause size={15} fill="currentColor" />
                  <span>Pause Sim</span>
                </>
              ) : (
                <>
                  <Play size={15} fill="currentColor" />
                  <span>Live Auto-Sim</span>
                </>
              )}
            </button>

            {/* Mute/Unmute audio */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute sound effects' : 'Unmute whistle/crowd cheer'}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-400 hover:text-white transition"
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* Reset Defaults */}
            <button
              onClick={handleResetMatches}
              title="Reset scores and matches back to original preloads"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-400 hover:text-white transition"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Real-time Ticker tape for live incidents */}
      <section className="bg-emerald-900/10 border-b border-emerald-950 py-2 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold px-2 py-0.5 rounded shrink-0">
            <Radio size={12} className="animate-pulse" />
            LIVE TICKER:
          </div>
          <div className="w-full relative overflow-hidden h-5">
            <div className="absolute inset-0 flex items-center">
              {/* Combine events of all games and sort by time, show top 3 */}
              {matches.some(m => m.events.length > 0) ? (
                <div className="flex gap-8 text-xs font-medium text-slate-300 animate-marquee whitespace-nowrap">
                  {matches
                    .flatMap(m => m.events.map(e => ({ ...e, matchLabel: `${m.teamA.flagEmoji} ${m.teamA.code} vs ${m.teamB.code} ${m.teamB.flagEmoji}` })))
                    .sort((a, b) => b.min - a.min)
                    .slice(0, 5)
                    .map((item, idx) => (
                      <span key={idx} className="inline-flex items-center gap-2">
                        <span className="text-emerald-400 font-bold">[{item.matchLabel}]</span>
                        <span className="text-slate-400 font-mono text-[10px] bg-slate-800 px-1 py-0.2 rounded font-black">{item.min}'</span>
                        <span>{item.description}</span>
                        {idx < 4 && <span className="text-slate-600 select-none">|</span>}
                      </span>
                    ))
                  }
                </div>
              ) : (
                <span className="text-xs text-slate-500 italic">No historical events recorded yet. Click Sim or trigger Goals to populate the reel!</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid Layout Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* Dynamic score summary header banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Tracker Metrics Card 1 */}
          <div className="bg-slate-900/40 p-4 rounded-3xl border border-slate-800/80 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Sim Status</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2.5 h-2.5 rounded-full ${isSimulating ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                <span className="text-sm font-black text-white uppercase tracking-tight">
                  {isSimulating ? 'Active Action' : 'Standby / Paused'}
                </span>
              </div>
            </div>
          </div>

          {/* Tracker Metrics Card 2 */}
          <div className="bg-slate-900/40 p-4 rounded-3xl border border-slate-800/80 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Gamepad2 size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Tournament Load</p>
              <p className="text-sm font-black text-white mt-0.5">
                {matches.length} Matches Preloaded
              </p>
            </div>
          </div>

          {/* Tracker Metrics Card 3 */}
          <div className="bg-slate-900/40 p-4 rounded-3xl border border-slate-800/80 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Trophy size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Top Scorer Leader</p>
              <p className="text-sm font-black text-white mt-0.5 truncate max-w-[170px]">
                {matches.flatMap(m => m.scorers).length > 0 
                  ? (() => {
                      const counts: Record<string, number> = {};
                      matches.flatMap(m => m.scorers).forEach(s => { counts[s.name] = (counts[s.name] || 0) + 1; });
                      const best = Object.entries(counts).sort((a,b) => b[1]-a[1])[0];
                      return `${best[0]} (${best[1]} ⚽)`;
                    })()
                  : 'No Goals Yet'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Outer search + filter bar */}
        <div id="filter-panel" className="bg-slate-900 p-4 rounded-3xl border border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center mb-8">
          
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                statusFilter === 'ALL' 
                  ? 'bg-slate-800 border border-white/10 text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Matches
            </button>
            <button
              onClick={() => setStatusFilter('LIVE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 ${
                statusFilter === 'LIVE' 
                  ? 'bg-emerald-950 border border-emerald-800 text-emerald-400' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Live Matches
            </button>
            <button
              onClick={() => setStatusFilter('HALF_TIME')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                statusFilter === 'HALF_TIME' 
                  ? 'bg-cyan-950 border border-cyan-800 text-cyan-400' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Half-Time
            </button>
            <button
              onClick={() => setStatusFilter('FULL_TIME')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                statusFilter === 'FULL_TIME' 
                  ? 'bg-slate-800 border border-slate-700/80 text-white/90' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Full-Time
            </button>
          </div>

          {/* Search and Insert controls */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search teams, groups..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs font-medium text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-extrabold rounded-xl transition active:scale-95 shrink-0 shadow-md shadow-emerald-500/5"
            >
              <Plus size={15} />
              New Match
            </button>
          </div>
        </div>

        {/* Major Dashboard Layout: Left vs Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Matches score cards list */}
          <section className="lg:col-span-7 flex flex-col gap-5">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Activity size={18} className="text-emerald-400" />
                Fixtures &amp; Standings Tracker
              </h2>
              <span className="text-xs font-mono text-slate-400">{filteredMatches.length} Matches listed</span>
            </div>

            {filteredMatches.length === 0 ? (
              <div className="p-12 text-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/30">
                <Trophy size={40} className="mx-auto text-slate-700 mb-3" />
                <p className="text-slate-400 font-medium">No matches match your filter criteria.</p>
                <button 
                  onClick={() => { setStatusFilter('ALL'); setSearchQuery(''); }}
                  className="mt-3 text-emerald-400 font-bold text-xs underline"
                >
                  Clear Status Filters
                </button>
              </div>
            ) : (
              filteredMatches.map((m) => {
                const isSelected = m.id === selectedMatchId;
                return (
                  <div
                    key={m.id}
                    id={`match-card-${m.id}`}
                    onClick={() => setSelectedMatchId(m.id)}
                    className={`relative rounded-3xl bg-slate-900 border transition-all duration-300 overflow-hidden cursor-pointer ${
                      isSelected 
                        ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/5 scale-[1.01]' 
                        : 'border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
                    }`}
                  >
                    {/* Top status bar inside individual card */}
                    <div className="px-5 py-3 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded-md">
                          {m.group}
                        </span>
                        
                        {/* Live min indicator */}
                        {m.status === 'LIVE' ? (
                          <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{m.minute}' Live</span>
                          </div>
                        ) : m.status === 'HALF_TIME' ? (
                          <span className="text-xs font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-800/30 px-2 py-0.2 rounded">
                            Half-Time
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-0.2 rounded">
                            Finished
                          </span>
                        )}
                      </div>

                      {/* Manual Match Status controllers directly inside cards */}
                      <div className="flex items-center gap-3">
                        <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5">
                          <select
                            value={m.status}
                            onChange={(e) => handleStatusChange(m.id, e.target.value as any)}
                            className="bg-slate-800 border border-slate-700/60 rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-300 focus:outline-none"
                          >
                            <option value="LIVE">LIVE</option>
                            <option value="HALF_TIME">HT</option>
                            <option value="FULL_TIME">FT</option>
                          </select>
                        </div>

                        {/* Slide input for match minutes (visible only in details or when playing) */}
                        <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 bg-slate-800/80 px-1.5 py-0.5 rounded">
                          <span className="text-[9px] font-mono font-bold text-slate-500">MIN:</span>
                          <input
                            type="number"
                            min="0"
                            max="90"
                            value={m.minute}
                            onChange={(e) => handleMinuteChange(m.id, parseInt(e.target.value) || 0)}
                            className="w-7 bg-transparent text-center font-mono text-slate-300 text-[10px] focus:outline-none focus:text-white"
                          />
                        </div>

                        {/* Delete match helper */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMatch(m.id);
                          }}
                          className="text-slate-600 hover:text-rose-400 p-0.5 rounded transition"
                          title="Delete game stats"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Central Scoreboard area */}
                    <div className="p-6 grid grid-cols-12 gap-2 items-center">
                      
                      {/* HOME TEAM */}
                      <div className="col-span-4 flex flex-col items-center text-center">
                        <motion.div 
                          className="w-16 h-16 rounded-full bg-slate-950/40 border-2 border-dashed border-slate-800 flex items-center justify-center text-4xl shadow-inner select-none relative"
                          whileHover={{ scale: 1.1 }}
                        >
                          {m.teamA.flagEmoji}
                          <div 
                            className="absolute -bottom-1 h-3.5 w-7 rounded-full border border-black/10 flex items-center justify-center"
                            style={{ backgroundColor: m.teamA.colors.primary }}
                          />
                        </motion.div>
                        <h4 className="mt-2 text-sm font-semibold text-white tracking-tight truncate max-w-[110px]">
                          {m.teamA.name}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-500 block mb-3">{m.teamA.code}</span>

                        {/* GOAL! trigger button home */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleManualGoal(m.id, 'A');
                          }}
                          className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl border border-dashed text-xs font-bold transition hover:scale-105 active:scale-95 bg-slate-800 hover:bg-slate-700/80 text-white"
                          style={{ borderColor: `${m.teamA.colors.primary}50` }}
                        >
                          ⚽ Goal!
                        </button>
                      </div>

                      {/* GAME SCORE */}
                      <div className="col-span-4 flex flex-col items-center">
                        <div id="scoreboard" className="flex items-center gap-3">
                          <span className="text-4xl font-extrabold tracking-tight font-mono text-white">
                            {m.scoreA}
                          </span>
                          <span className="text-slate-600 text-lg font-bold font-mono">-</span>
                          <span className="text-4xl font-extrabold tracking-tight font-mono text-white">
                            {m.scoreB}
                          </span>
                        </div>

                        {/* Possession % quick gauge */}
                        <div className="w-full max-w-[100px] mt-4">
                          <div className="flex justify-between text-[9px] font-mono text-slate-500 font-bold mb-1">
                            <span>{m.possession[0]}%</span>
                            <span>POSS</span>
                            <span>{m.possession[1]}%</span>
                          </div>
                          <div className="h-1 bg-slate-800 rounded-full flex overflow-hidden">
                            <div className="h-full" style={{ width: `${m.possession[0]}%`, backgroundColor: m.teamA.colors.primary }} />
                            <div className="h-full" style={{ width: `${m.possession[1]}%`, backgroundColor: m.teamB.colors.primary }} />
                          </div>
                        </div>

                        <span className="mt-4 text-[10px] font-semibold text-slate-500 flex items-center gap-1.5 bg-slate-950/30 px-3 py-1 rounded-full uppercase tracking-wider">
                          <Eye size={11} className="text-emerald-400" />
                          View Hub
                        </span>
                      </div>

                      {/* AWAY TEAM */}
                      <div className="col-span-4 flex flex-col items-center text-center">
                        <motion.div 
                          className="w-16 h-16 rounded-full bg-slate-950/40 border-2 border-dashed border-slate-800 flex items-center justify-center text-4xl shadow-inner select-none relative"
                          whileHover={{ scale: 1.1 }}
                        >
                          {m.teamB.flagEmoji}
                          <div 
                            className="absolute -bottom-1 h-3.5 w-7 rounded-full border border-black/10 flex items-center justify-center"
                            style={{ backgroundColor: m.teamB.colors.primary }}
                          />
                        </motion.div>
                        <h4 className="mt-2 text-sm font-semibold text-white tracking-tight truncate max-w-[110px]">
                          {m.teamB.name}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-500 block mb-3">{m.teamB.code}</span>

                        {/* GOAL! trigger button away */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleManualGoal(m.id, 'B');
                          }}
                          className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl border border-dashed text-xs font-bold transition hover:scale-105 active:scale-95 bg-slate-800 hover:bg-slate-700/80 text-white"
                          style={{ borderColor: `${m.teamB.colors.primary}50` }}
                        >
                          ⚽ Goal!
                        </button>
                      </div>

                    </div>

                    {/* Expandable Scorer list banner inside the card */}
                    {m.scorers.length > 0 && (
                      <div className="px-6 py-2.5 bg-slate-950/20 border-t border-white/[0.02] flex items-center flex-wrap gap-2 text-[10px] text-slate-400 font-mono">
                        <span className="font-bold text-slate-500">Scorers:</span>
                        {m.scorers.map((s, sIdx) => (
                          <span key={sIdx} className="bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/30 flex items-center gap-1">
                            <span>{s.teamCode === m.teamA.code ? m.teamA.flagEmoji : m.teamB.flagEmoji}</span>
                            <span className="font-semibold text-slate-300">{s.name}</span>
                            <span className="text-emerald-400 font-black">({s.min}')</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </section>

          {/* RIGHT COLUMN: Stadium Cam & Interactive Live stats hub */}
          <section className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Tactical stadium field component */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Gamepad2 size={16} className="text-emerald-400" />
                  Tactical Command
                </h2>
                <span className="text-xs bg-slate-800/80 px-2 py-0.5 rounded text-slate-400 font-medium">
                  {selectedMatch.teamA.code} vs {selectedMatch.teamB.code} Hub
                </span>
              </div>
              <StadiumField
                match={selectedMatch}
                onGoal={(teamCode) => {
                  const isA = selectedMatch.teamA.code === teamCode;
                  handleManualGoal(selectedMatch.id, isA ? 'A' : 'B');
                }}
                onSimulateAction={handleSimulateIncidentObj}
              />
            </div>

            {/* Simulated detailed stats list of selected match */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
              <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  Statistical Breakdowns
                </h3>
                <span className="text-[10px] font-mono text-cyan-400">Match Ref: Real-time telemetry</span>
              </div>

              <div className="space-y-3.5 text-xs text-slate-300">
                {/* Shots on Target */}
                <div>
                  <div className="flex justify-between font-mono font-bold text-slate-400 mb-1">
                    <span>{selectedMatch.shots[0]}</span>
                    <span>Shots on Target</span>
                    <span>{selectedMatch.shots[1]}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full flex overflow-hidden">
                    <div 
                      className="h-full transition-all duration-300" 
                      style={{ 
                        width: `${selectedMatch.shots[0] + selectedMatch.shots[1] > 0 
                          ? (selectedMatch.shots[0] / (selectedMatch.shots[0] + selectedMatch.shots[1])) * 100 
                          : 50}%`, 
                        backgroundColor: selectedMatch.teamA.colors.primary 
                      }} 
                    />
                    <div 
                      className="h-full transition-all duration-300" 
                      style={{ 
                        width: `${selectedMatch.shots[0] + selectedMatch.shots[1] > 0 
                          ? (selectedMatch.shots[1] / (selectedMatch.shots[0] + selectedMatch.shots[1])) * 100 
                          : 50}%`, 
                        backgroundColor: selectedMatch.teamB.colors.primary 
                      }} 
                    />
                  </div>
                </div>

                {/* Fouls */}
                <div>
                  <div className="flex justify-between font-mono font-bold text-slate-400 mb-1">
                    <span>{selectedMatch.fouls[0]}</span>
                    <span>Fouls</span>
                    <span>{selectedMatch.fouls[1]}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full flex overflow-hidden">
                    <div 
                      className="h-full transition-all duration-300" 
                      style={{ 
                        width: `${selectedMatch.fouls[0] + selectedMatch.fouls[1] > 0 
                          ? (selectedMatch.fouls[0] / (selectedMatch.fouls[0] + selectedMatch.fouls[1])) * 100 
                          : 50}%`, 
                        backgroundColor: selectedMatch.teamA.colors.primary 
                      }} 
                    />
                    <div 
                      className="h-full transition-all duration-300" 
                      style={{ 
                        width: `${selectedMatch.fouls[0] + selectedMatch.fouls[1] > 0 
                          ? (selectedMatch.fouls[1] / (selectedMatch.fouls[0] + selectedMatch.fouls[1])) * 100 
                          : 50}%`, 
                        backgroundColor: selectedMatch.teamB.colors.primary 
                      }} 
                    />
                  </div>
                </div>

                {/* Yellow cards booking highlights */}
                <div className="flex items-center justify-between py-1.5 border-t border-slate-800/60 mt-2">
                  <div className="flex items-center gap-1 font-bold">
                    <span className="w-2 h-3.5 bg-yellow-400 rounded-sm inline-block border border-black/20" />
                    <span>{selectedMatch.yellowCards[0]}</span>
                  </div>
                  <span className="text-slate-500 font-mono text-[10px] uppercase font-bold tracking-widest">Yellow Bookings</span>
                  <div className="flex items-center gap-1 font-bold">
                    <span>{selectedMatch.yellowCards[1]}</span>
                    <span className="w-2 h-3.5 bg-yellow-400 rounded-sm inline-block border border-black/20" />
                  </div>
                </div>
              </div>
            </div>

            {/* Calculated league standings component */}
            <StandingsTable matches={matches} />

            {/* Event logs timeline panel */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl max-h-[300px] overflow-y-auto">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  Live Event log
                </h3>
                <span className="text-[10px] text-slate-500 font-bold uppercase">{selectedMatch.teamA.code} vs {selectedMatch.teamB.code}</span>
              </div>

              {selectedMatch.events.length === 0 ? (
                <p className="text-slate-500 text-xs italic text-center py-6">No notable incidents registered. Keep tracking or click sim!</p>
              ) : (
                <div className="space-y-3">
                  {selectedMatch.events.map((ev, idx) => (
                    <div key={idx} className="flex gap-2.5 items-start text-xs leading-relaxed border-b border-slate-800/40 pb-2">
                      <span className="font-mono text-[10px] text-emerald-400 bg-slate-800 rounded px-1 min-w-[28px] text-center font-black">
                        {ev.min}'
                      </span>
                      <div className="flex-1">
                        {ev.type === 'goal' ? (
                          <span className="font-bold text-amber-400">⚽ {ev.description}</span>
                        ) : ev.type === 'yellow_card' ? (
                          <span className="font-bold text-yellow-400">🟨 {ev.description}</span>
                        ) : (
                          <span className="text-slate-300">{ev.description}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </section>

        </div>
      </main>

      {/* FOOTER credit and instruction block */}
      <footer className="mt-16 text-center text-slate-600 text-[11px] font-medium tracking-wide">
        <p>© 2026 World Cup Match Command Tracker — Crafted in Slate Theme with Synthesized Football Audio.</p>
        <p className="mt-1 text-slate-700">Feel free to adjust match parameters or initiate custom derbies using the control grid.</p>
      </footer>

      {/* Goal celebrations slide overlay */}
      <GoalOverlay
        isVisible={celebration.isVisible}
        scoringTeam={celebration.scoringTeam}
        playerName={celebration.playerName}
        onComplete={() => setCelebration({ isVisible: false, scoringTeam: null, playerName: '' })}
      />

      {/* Modal logic to insert custom matches */}
      <AnimatePresence>
        {isAddOpen && (
          <div id="add-match-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddOpen(false)}
            />
            
            <motion.div
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl z-10 text-left"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
            >
              <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-3">
                <h3 className="text-lg font-black text-white tracking-tight">Create World Cup Fixture</h3>
                <button
                  onClick={() => setIsAddOpen(false)}
                  className="text-slate-500 hover:text-white font-bold text-xs"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateMatch} className="space-y-4">
                
                {/* Home team picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Home Team</label>
                  <select
                    value={addHomeCode}
                    onChange={(e) => setAddHomeCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                  >
                    {Object.entries(ALL_TEAM_CHOICES).map(([code, team]) => (
                      <option key={code} value={code}>
                        {team.flagEmoji} {team.name} ({code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Away team picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Away Team (Opponent)</label>
                  <select
                    value={addAwayCode}
                    onChange={(e) => setAddAwayCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                  >
                    {Object.entries(ALL_TEAM_CHOICES).map(([code, team]) => (
                      <option key={code} value={code}>
                        {team.flagEmoji} {team.name} ({code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Starter parameters */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Starting Status</label>
                    <select
                      value={addStatus}
                      onChange={(e) => setAddStatus(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white"
                    >
                      <option value="LIVE">LIVE</option>
                      <option value="HALF_TIME">HALF_TIME</option>
                      <option value="FULL_TIME">FULL_TIME</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Stage / Group</label>
                    <input
                      type="text"
                      value={addGroup}
                      onChange={(e) => setAddGroup(e.target.value)}
                      placeholder="e.g. Group B"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Starting Minute</label>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={addMinute}
                    onChange={(e) => setAddMinute(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Action buttons */}
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-800 text-xs text-slate-400 hover:text-white font-bold transition hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black transition active:scale-95"
                  >
                    Add Fixture
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
