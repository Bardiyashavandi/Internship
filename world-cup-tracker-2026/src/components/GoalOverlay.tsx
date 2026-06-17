import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Team } from '../types';

interface GoalOverlayProps {
  isVisible: boolean;
  scoringTeam: Team | null;
  playerName: string;
  onComplete: () => void;
}

export const GoalOverlay: React.FC<GoalOverlayProps> = ({
  isVisible,
  scoringTeam,
  playerName,
  onComplete,
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onComplete();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && scoringTeam && (
        <motion.div
          id="goal-overlay-backdrop"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-black/90 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Pulsating colorful gradient rings in background match scoring team colors */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30 select-none">
            <motion.div
              className="absolute w-[300px] h-[300px] rounded-full blur-[100px]"
              style={{ backgroundColor: scoringTeam.colors.primary }}
              animate={{
                scale: [1, 2, 1.3, 1.8, 1],
                opacity: [0.3, 0.7, 0.5, 0.8, 0.3],
              }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute w-[450px] h-[450px] rounded-full blur-[150px]"
              style={{ backgroundColor: scoringTeam.colors.secondary }}
              animate={{
                scale: [1.2, 0.8, 1.5, 1, 1.2],
                opacity: [0.2, 0.5, 0.3, 0.6, 0.2],
              }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            />
          </div>

          {/* Golden spotlights scanning the backdrop */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(253,224,71,0.15),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(253,224,71,0.15),transparent_40%)]" />

          {/* Goal Word Animation */}
          <div className="relative text-center px-4">
            <motion.div
              id="goal-text-container"
              initial={{ scale: 0.3, y: 100, rotate: -15 }}
              animate={{
                scale: [0.3, 1.4, 1.1, 1.2, 1],
                y: [100, -20, 10, 0, 0],
                rotate: [-15, 10, -5, 2, 0],
              }}
              transition={{
                type: 'spring',
                damping: 10,
                stiffness: 100,
                duration: 0.8,
              }}
              className="font-extrabold tracking-wider text-transparent bg-clip-text select-none text-7xl sm:text-9xl md:text-[12rem]"
              style={{
                backgroundImage: `linear-gradient(135deg, ${scoringTeam.colors.primary} 30%, ${scoringTeam.colors.secondary} 100%)`,
                textShadow: `0 0 40px ${scoringTeam.colors.primary}40`,
              }}
            >
              GOAAAL!
            </motion.div>

            {/* Soccer Ball icon bursting across the screen */}
            <motion.div
              id="goal-soccer-ball"
              initial={{ scale: 0, rotate: 0, y: 150 }}
              animate={{
                scale: [0, 1.2, 1],
                rotate: 720,
                y: 0,
              }}
              transition={{ delay: 0.2, duration: 0.7, type: 'spring' }}
              className="flex justify-center my-6 text-6xl md:text-8xl"
            >
              ⚽
            </motion.div>

            {/* Scorer Info */}
            <motion.div
              id="scorer-banner"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="flex flex-col items-center justify-center p-6 mx-auto rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-md max-w-md shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl shadow-sm">{scoringTeam.flagEmoji}</span>
                <span className="text-xl font-bold text-white tracking-wide uppercase">
                  {scoringTeam.name}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-xs text-white border border-white/10">
                  {scoringTeam.code}
                </span>
              </div>
              
              <div className="text-2xl font-black text-amber-400 tracking-tight mt-1 text-center">
                {playerName || 'Unknown Player'}
              </div>
              
              <div className="text-sm font-medium text-slate-400 mt-1 uppercase tracking-widest">
                Stunner Score! ⚽🔥
              </div>
            </motion.div>
          </div>

          {/* Strobe flashlight frames */}
          <motion.div
            id="strobe-flash"
            className="absolute inset-0 bg-white"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.4, 0, 0.3, 0, 0.2, 0, 0.1, 0],
            }}
            transition={{ duration: 0.8, times: [0, 0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 1] }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
