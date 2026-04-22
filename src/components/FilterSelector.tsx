import { motion } from 'motion/react';
import { FilterType, FILTER_METADATA } from '../types';
import { cn } from '../lib/utils';
import { Sparkles, Lock } from 'lucide-react';

interface FilterSelectorProps {
  selected: FilterType;
  onSelect: (filter: FilterType) => void;
  suggested?: FilterType;
  isLoggedIn: boolean;
  isProcessing: boolean;
}

export default function FilterSelector({ selected, onSelect, suggested, isLoggedIn, isProcessing }: FilterSelectorProps) {
  const filters = Object.keys(FILTER_METADATA) as FilterType[];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-brown-900/40">Choose Aesthetic</h4>
        {suggested && (
          <div className="flex items-center gap-1 text-[10px] bg-brown-900 text-beige-100 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse transition-all">
            <Sparkles className="w-3 h-3" />
            AI Recommended
          </div>
        )}
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {filters.map((filter) => {
          const isSelected = selected === filter;
          const isSuggested = suggested === filter;
          const info = FILTER_METADATA[filter];
          const isLocked = info.isPremium && !isLoggedIn;
          const isDisabled = isLocked || isProcessing;
          
          return (
            <motion.button
              key={filter}
              whileHover={isDisabled ? {} : { scale: 1.05, y: -4 }}
              whileTap={isDisabled ? {} : { scale: 0.98 }}
              onClick={() => !isDisabled && onSelect(filter)}
              className={cn(
                "relative group flex-shrink-0 flex flex-col items-center gap-2",
                "h-24 w-24 rounded-2xl transition-all duration-300 overflow-hidden",
                isSelected 
                  ? "ring-2 ring-brown-900 ring-offset-2 shadow-lg scale-105 z-10" 
                  : "bg-beige-200",
                isDisabled && "opacity-60 grayscale cursor-not-allowed"
              )}
            >
              {/* Filter Preview Placeholder */}
              <div className={cn(
                "w-full h-full flex flex-col items-center justify-center text-[10px] font-bold uppercase tracking-widest p-2 text-center leading-tight transition-all duration-300",
                "group-hover:brightness-110 group-hover:contrast-110",
                getFilterColorClass(filter)
              )}>
                {isLocked && <Lock className="w-4 h-4 mb-1 text-brown-900/40" />}
                {info.label}
              </div>
              
              {isSelected && (
                <motion.div 
                  layoutId="active-filter"
                  className="absolute inset-0 bg-brown-900/10 pointer-events-none"
                />
              )}

              {isSuggested && !isSelected && !isLocked && (
                <div className="absolute top-1 right-1">
                  <Sparkles className="w-3 h-3 text-brown-900" />
                </div>
              )}

              {info.isPremium && (
                <div className="absolute top-1 left-1 bg-brown-900/10 px-1 rounded text-[8px] font-bold text-brown-900/60 transition-all">
                  PREMIUM
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function getFilterColorClass(filter: FilterType) {
  switch(filter) {
    case 'vintage': return 'bg-[#e9dcc9] text-[#5c4033]';
    case 'retro': return 'bg-[#d2691e] text-white';
    case 'cinematic': return 'bg-[#003d4d] text-[#ff8c00]';
    case 'glow': return 'bg-[#fff0f5] text-[#db7093]';
    case 'bw': return 'bg-[#2f4f4f] text-[#f5f5f5]';
    case 'warm': return 'bg-[#ff7f50] text-white';
    case 'cold': return 'bg-[#e0ffff] text-[#4682b4]';
    case 'instagram': return 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 text-white';
    case 'noir': return 'bg-black text-white';
    case 'vibrant': return 'bg-yellow-100 text-[#ff4e00]';
    case 'pastel': return 'bg-[#f8f9fa] text-[#6c757d]';
    case 'cyberpunk': return 'bg-[#0a0a0a] text-[#ff00ff]';
    case 'brutalist': return 'bg-[#e5e5e5] text-[#1a1a1a]';
    default: return 'bg-white text-brown-900';
  }
}
