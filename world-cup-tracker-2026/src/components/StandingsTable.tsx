import React from 'react';
import { Match, Team } from '../types';
import { TEAMS } from '../data';
import { Award, TrendingUp, ShieldAlert } from 'lucide-react';

interface StandingsTableProps {
  matches: Match[];
}

interface TeamStats {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number; // Goals For
  ga: number; // Goals Against
  gd: number; // Goal Difference
  pts: number; // Points
}

export const StandingsTable: React.FC<StandingsTableProps> = ({ matches }) => {
  // Initialize stats for each team pre-loaded
  const stats: Record<string, TeamStats> = {};
  
  Object.keys(TEAMS).forEach((code) => {
    stats[code] = {
      team: TEAMS[code],
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      pts: 0,
    };
  });

  // Calculate live stats from current match states
  matches.forEach((m) => {
    const codeA = m.teamA.code;
    const codeB = m.teamB.code;

    // Only compute if we have defined states
    if (stats[codeA] && stats[codeB]) {
      stats[codeA].played += 1;
      stats[codeB].played += 1;
      
      stats[codeA].gf += m.scoreA;
      stats[codeA].ga += m.scoreB;
      stats[codeB].gf += m.scoreB;
      stats[codeB].ga += m.scoreA;

      if (m.scoreA > m.scoreB) {
        stats[codeA].won += 1;
        stats[codeA].pts += 3;
        stats[codeB].lost += 1;
      } else if (m.scoreA < m.scoreB) {
        stats[codeB].won += 1;
        stats[codeB].pts += 3;
        stats[codeA].lost += 1;
      } else {
        stats[codeA].drawn += 1;
        stats[codeA].pts += 1;
        stats[codeB].drawn += 1;
        stats[codeB].pts += 1;
      }
    }
  });

  // Recompute GD
  Object.keys(stats).forEach((code) => {
    stats[code].gd = stats[code].gf - stats[code].ga;
  });

  // Sort: 1) Points, 2) GD, 3) Goals For, 4) Name
  const sortedStats = Object.values(stats).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.team.name.localeCompare(b.team.name);
  });

  return (
    <div id="standings-table-container" className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-5 border-b border-white/5 pb-4">
          <div>
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-0.5">
              Live Standings
            </span>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Award className="text-amber-400" size={18} />
              World Cup 2026 Group Stage
            </h3>
          </div>
          <div className="px-2 py-1 rounded bg-cyan-950/40 border border-cyan-800/40 text-[10px] font-bold text-cyan-400">
            GROUP A-Z SIM
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs font-mono">
                <th className="py-2.5 font-medium w-8 text-center">Pos</th>
                <th className="py-2.5 font-medium">Team</th>
                <th className="py-2.5 font-medium text-center w-8">P</th>
                <th className="py-2.5 font-medium text-center w-8">W</th>
                <th className="py-2.5 font-medium text-center w-8">D</th>
                <th className="py-2.5 font-medium text-center w-8">L</th>
                <th className="py-2.5 font-medium text-center w-12">GD</th>
                <th className="py-2.5 font-medium text-center w-10 text-cyan-400">Pts</th>
              </tr>
            </thead>
            <tbody>
              {sortedStats.map((stat, idx) => {
                const isTop2 = idx < 2;
                return (
                  <tr 
                    key={stat.team.code} 
                    className="border-b border-slate-800/40 hover:bg-slate-800/25 transition duration-150"
                  >
                    <td className="py-3 text-center font-mono font-bold text-slate-400">
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-xs ${
                        isTop2 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-500'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2 font-semibold text-white">
                        <span className="text-xl select-none" role="img" aria-label={stat.team.name}>
                          {stat.team.flagEmoji}
                        </span>
                        <span className="truncate max-w-[90px] sm:max-w-[130px]">{stat.team.name}</span>
                        <span className="text-[10px] font-bold text-slate-500 font-mono hidden sm:inline">
                          {stat.team.code}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-center font-mono text-slate-300">{stat.played}</td>
                    <td className="py-3 text-center font-mono text-slate-300">{stat.won}</td>
                    <td className="py-3 text-center font-mono text-slate-300">{stat.drawn}</td>
                    <td className="py-3 text-center font-mono text-slate-300">{stat.lost}</td>
                    <td className={`py-3 text-center font-mono font-semibold ${
                      stat.gd > 0 ? 'text-emerald-400' : stat.gd < 0 ? 'text-rose-400' : 'text-slate-400'
                    }`}>
                      {stat.gd > 0 ? `+${stat.gd}` : stat.gd}
                    </td>
                    <td className="py-3 text-center font-mono font-black text-cyan-400">{stat.pts}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-2 text-[10px] text-slate-500 font-medium">
        <TrendingUp size={12} className="text-emerald-500 shrink-0" />
        <span>Top 2 teams qualify for Round of 16. Real-time updates active.</span>
      </div>
    </div>
  );
};
