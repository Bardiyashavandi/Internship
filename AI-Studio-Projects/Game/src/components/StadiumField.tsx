import React from 'react';
import { motion } from 'motion/react';
import { Match } from '../types';
import { PlusCircle, Award, ShieldAlert, Footprints, Target } from 'lucide-react';

interface StadiumFieldProps {
  match: Match;
  onGoal: (teamCode: string) => void;
  onSimulateAction: (type: 'shot' | 'corner' | 'foul' | 'yellow_card', teamCode: string) => void;
}

export const StadiumField: React.FC<StadiumFieldProps> = ({
  match,
  onGoal,
  onSimulateAction,
}) => {
  const { teamA, teamB, scoreA, scoreB, minute, status } = match;

  return (
    <div id="stadium-field-box" className="relative p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
      {/* Pitch Stadium Gradient Light glow */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />

      {/* Field Header */}
      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 border-b border-white/5 pb-4">
        <div>
          <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest block mb-0.5">
            Stadium Tactical Cam
          </span>
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            🏟️ {match.stadium}
          </h3>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1 rounded-full text-xs font-mono font-semibold text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Camera 1: Broadcaster
        </div>
      </div>

      {/* The 2D Tactical Field Layout */}
      <div 
        id="tactical-field-pitch" 
        className="relative w-full aspect-[2/1] rounded-2xl border-4 border-emerald-400/40 bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-950 shadow-inner overflow-hidden flex flex-col justify-between"
        style={{
          boxShadow: 'inset 0 0 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Field Grass Mowing Patterns (Stripes) */}
        <div className="absolute inset-0 flex pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-full ${i % 2 === 0 ? 'bg-black/5' : 'bg-transparent'}`}
            />
          ))}
        </div>

        {/* Pitch Lines */}
        {/* Center Line */}
        <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/25 -translate-x-1/2" />
        
        {/* Center Circle */}
        <div className="absolute top-1/2 left-1/2 w-20 sm:w-28 md:w-36 aspect-square rounded-full border border-white/25 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center p-0.5">
          {/* Center Spot */}
          <div className="w-1.5 h-1.5 bg-white/70 rounded-full" />
        </div>

        {/* Left Goal Area (Goal Box) */}
        <div className="absolute inset-y-8 left-0 w-8 sm:w-16 border-y border-r border-white/20" />
        {/* Left Penalty Area */}
        <div className="absolute inset-y-4 left-0 w-16 sm:w-28 border-y border-r border-white/25 flex items-center justify-end pr-3">
          {/* Penalty Spot */}
          <div className="w-1 h-1 bg-white/60 rounded-full" />
        </div>

        {/* Right Goal Area */}
        <div className="absolute inset-y-8 right-0 w-8 sm:w-16 border-y border-l border-white/20" />
        {/* Right Penalty Area */}
        <div className="absolute inset-y-4 right-0 w-16 sm:w-28 border-y border-l border-white/25 flex items-center justify-start pl-3">
          {/* Penalty Spot */}
          <div className="w-1 h-1 bg-white/60 rounded-full" />
        </div>

        {/* Soccer ball floating state */}
        <motion.div
          id="tactical-ball"
          className="absolute z-10 text-xl sm:text-2xl cursor-pointer"
          style={{
            top: '50%',
            left: '50%',
            x: '-50%',
            y: '-50%',
          }}
          animate={{
            y: ['-50%', '-70%', '-50%'],
            scale: [1, 1.15, 1],
          }}
          transition={{
            repeat: Infinity,
            duration: 2.2,
            ease: 'easeInOut',
          }}
          onClick={() => onSimulateAction('shot', Math.random() > 0.5 ? teamA.code : teamB.code)}
          title="Click to kick the ball!"
        >
          ⚽
        </motion.div>

        {/* Left Attacking Team Badge inside Pitch */}
        <div className="absolute left-[15%] sm:left-[20%] top-1/2 -translate-y-1/2 flex flex-col items-center">
          <motion.div
            className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-2 border-white flex items-center justify-center text-xl sm:text-2xl shadow-lg relative cursor-pointer"
            style={{
              backgroundColor: teamA.colors.primary,
              borderColor: teamA.colors.secondary,
              boxShadow: `0 0 16px ${teamA.colors.primary}aa`,
            }}
            whileHover={{ scale: 1.1 }}
            onClick={() => onGoal(teamA.code)}
          >
            {teamA.flagEmoji}
            {/* Direct Score display on pitch */}
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 border border-slate-700 text-[10px] font-black text-white">
              {scoreA}
            </span>
          </motion.div>
          <span className="mt-1 text-[10px] sm:text-xs font-black text-white bg-slate-900/80 px-2 py-0.5 rounded-full select-none">
            {teamA.code}
          </span>
        </div>

        {/* Right Attacking Team Badge inside Pitch */}
        <div className="absolute right-[15%] sm:right-[20%] top-1/2 -translate-y-1/2 flex flex-col items-center">
          <motion.div
            className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-2 border-white flex items-center justify-center text-xl sm:text-2xl shadow-lg relative cursor-pointer"
            style={{
              backgroundColor: teamB.colors.primary,
              borderColor: teamB.colors.secondary,
              boxShadow: `0 0 16px ${teamB.colors.primary}aa`,
            }}
            whileHover={{ scale: 1.1 }}
            onClick={() => onGoal(teamB.code)}
          >
            {teamB.flagEmoji}
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 border border-slate-700 text-[10px] font-black text-white">
              {scoreB}
            </span>
          </motion.div>
          <span className="mt-1 text-[10px] sm:text-xs font-black text-white bg-slate-900/80 px-2 py-0.5 rounded-full select-none">
            {teamB.code}
          </span>
        </div>

        {/* Outer Corner flags representation */}
        <div className="absolute top-1 left-1 text-xs opacity-50">🚩</div>
        <div className="absolute bottom-1 left-1 text-xs opacity-50">🚩</div>
        <div className="absolute top-1 right-1 text-xs opacity-50">🚩</div>
        <div className="absolute bottom-1 right-1 text-xs opacity-50">🚩</div>
      </div>

      {/* Interactive tactical quick controls */}
      <div id="tactical-controls" className="mt-4 grid grid-cols-2 gap-4">
        {/* Team A quick incident trigger */}
        <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: teamA.colors.primary }} />
            {teamA.name} Incidents
          </p>
          <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-300">
            <button
              onClick={() => onSimulateAction('shot', teamA.code)}
              className="flex items-center gap-1 justify-center py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700/60 font-medium transition active:scale-95"
            >
              <Target size={12} className="text-amber-400" />
              Shot
            </button>
            <button
              onClick={() => onSimulateAction('corner', teamA.code)}
              className="flex items-center gap-1 justify-center py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700/60 font-medium transition active:scale-95"
            >
              <Footprints size={12} className="text-emerald-400" />
              Corner
            </button>
            <button
              onClick={() => onSimulateAction('foul', teamA.code)}
              className="flex items-center gap-1 justify-center py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700/60 font-medium transition active:scale-95"
            >
              <ShieldAlert size={12} className="text-stone-400" />
              Foul
            </button>
            <button
              onClick={() => onSimulateAction('yellow_card', teamA.code)}
              className="flex items-center gap-1 justify-center py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700/60 font-medium transition active:scale-95"
            >
              <span className="w-2.5 h-3.5 bg-yellow-400 rounded-sm border border-black/20 block" />
              Yellow
            </button>
          </div>
        </div>

        {/* Team B quick incident trigger */}
        <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-slate-800/40 border border-slate-700/50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: teamB.colors.primary }} />
            {teamB.name} Incidents
          </p>
          <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-300">
            <button
              onClick={() => onSimulateAction('shot', teamB.code)}
              className="flex items-center gap-1 justify-center py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700/60 font-medium transition active:scale-95"
            >
              <Target size={12} className="text-amber-400" />
              Shot
            </button>
            <button
              onClick={() => onSimulateAction('corner', teamB.code)}
              className="flex items-center gap-1 justify-center py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700/60 font-medium transition active:scale-95"
            >
              <Footprints size={12} className="text-emerald-400" />
              Corner
            </button>
            <button
              onClick={() => onSimulateAction('foul', teamB.code)}
              className="flex items-center gap-1 justify-center py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700/60 font-medium transition active:scale-95"
            >
              <ShieldAlert size={12} className="text-stone-400" />
              Foul
            </button>
            <button
              onClick={() => onSimulateAction('yellow_card', teamB.code)}
              className="flex items-center gap-1 justify-center py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700/60 font-medium transition active:scale-95"
            >
              <span className="w-2.5 h-3.5 bg-yellow-400 rounded-sm border border-black/20 block" />
              Yellow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
