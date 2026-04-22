import { motion } from 'motion/react';
import { FilterType } from '../types';

interface FilterProcessingOverlayProps {
  filter: FilterType;
}

export default function FilterProcessingOverlay({ filter }: FilterProcessingOverlayProps) {
  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {/* Dynamic Filter Effects */}
      {filter === 'vintage' && (
        <motion.div 
          animate={{ opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 0.1, repeat: Infinity }}
          className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/p6.png')] mix-blend-overlay opacity-20"
        />
      )}

      {filter === 'retro' && (
        <>
          <motion.div 
            animate={{ x: [-2, 2, -1], y: [1, -1, 2] }}
            transition={{ duration: 0.2, repeat: Infinity }}
            className="absolute inset-0 bg-white/5 mix-blend-overlay"
          />
          <motion.div 
            initial={{ left: '-10%' }}
            animate={{ left: ['0%', '100%'] }}
            transition={{ duration: 0.05, repeat: Infinity, repeatDelay: 1 }}
            className="absolute top-0 bottom-0 w-px bg-white/20"
          />
        </>
      )}

      {filter === 'cinematic' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: [0, 0.4, 0],
            scale: [0.8, 1.2, 1.5],
            x: ['-50%', '150%']
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-0 w-full h-8 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent blur-xl -translate-y-1/2"
        />
      )}

      {filter === 'cyberpunk' && (
        <div className="absolute inset-0">
          <motion.div 
            animate={{ 
              opacity: [0, 0.8, 0],
              y: ['0%', '100%']
            }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.5 }}
            className="absolute left-0 right-0 h-px bg-fuchsia-500 shadow-[0_0_10px_#f0f]"
          />
          <motion.div 
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 0.1, repeat: Infinity }}
            className="absolute inset-0 bg-cyan-500/5 mix-blend-screen"
          />
        </div>
      )}

      {filter === 'glow' && (
        <motion.div 
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-white shadow-[inset_0_0_100px_rgba(255,255,255,0.5)]"
        />
      )}

      {filter === 'noir' && (
        <motion.div 
          animate={{ opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 0.05, repeat: Infinity }}
          className="absolute inset-0 bg-black/20"
        />
      )}

      {filter === 'vibrant' && (
        <motion.div 
          animate={{ scale: [1, 1.05, 1], opacity: [0, 0.2, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-to-tr from-orange-500/20 to-yellow-500/20 mix-blend-screen"
        />
      )}

      {filter === 'pastel' && (
        <motion.div 
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-to-br from-pink-200/20 via-blue-200/20 to-green-200/20 mix-blend-screen"
        />
      )}

      {filter === 'brutalist' && (
        <div className="absolute inset-0 opacity-10">
          <motion.div 
            animate={{ opacity: [0.2, 0.5, 0.2], x: [-1, 1, -1] }}
            transition={{ duration: 0.1, repeat: Infinity }}
            className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/criss-xcross.png')] grayscale"
          />
        </div>
      )}

      {/* Default/Background Scan */}
      <motion.div 
        initial={{ top: "-10%" }}
        animate={{ top: "110%" }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-[20%] bg-gradient-to-b from-transparent via-white/5 to-transparent z-0"
      />
    </div>
  );
}
