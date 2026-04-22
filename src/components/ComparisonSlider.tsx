import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Columns, Split } from 'lucide-react';

interface ComparisonSliderProps {
  before: string;
  after: string;
  className?: string;
}

type ViewMode = 'slider' | 'side-by-side';

export default function ComparisonSlider({ before, after, className }: ComparisonSliderProps) {
  const [position, setPosition] = useState(50);
  const [viewMode, setViewMode] = useState<ViewMode>('slider');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current || viewMode !== 'slider') return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const newPos = ((x - rect.left) / rect.width) * 100;
    setPosition(Math.min(Math.max(newPos, 0), 100));
  };

  return (
    <div className="flex flex-col gap-4">
      <div 
        ref={containerRef}
        className={cn(
          "relative aspect-square md:aspect-video w-full overflow-hidden rounded-2xl group bg-beige-200 flex items-center justify-center", 
          viewMode === 'slider' ? "cursor-ew-resize" : "cursor-default",
          className
        )}
        onMouseMove={handleMove}
        onTouchMove={handleMove}
      >
        <AnimatePresence mode="wait">
          {viewMode === 'slider' ? (
            <motion.div 
              key="slider-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {/* Before Image */}
              <img 
                src={before} 
                alt="Before" 
                className="max-w-full max-h-full w-auto h-auto object-contain"
                referrerPolicy="no-referrer"
              />

              {/* After Image (Clipped) */}
              <div 
                className="absolute inset-0 flex items-center justify-center overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
              >
                <img 
                  src={after} 
                  alt="After" 
                  className="max-w-full max-h-full w-auto h-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Slider Line */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10"
                style={{ left: `${position}%` }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border border-beige-300">
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-brown-900 rounded-full" />
                    <div className="w-1 h-1 bg-brown-900 rounded-full" />
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="side-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex"
            >
              <div className="relative flex-1 h-full border-r border-white/20 bg-beige-300 flex items-center justify-center overflow-hidden">
                <img src={before} alt="Before" className="max-w-full max-h-full w-auto h-auto object-contain" referrerPolicy="no-referrer" />
                <div className="absolute bottom-4 left-4 z-10 text-[10px] uppercase tracking-widest text-white bg-black/30 px-2 py-1 rounded backdrop-blur-sm">
                  Before
                </div>
              </div>
              <div className="relative flex-1 h-full bg-beige-300 flex items-center justify-center overflow-hidden">
                <img src={after} alt="After" className="max-w-full max-h-full w-auto h-auto object-contain" referrerPolicy="no-referrer" />
                <div className="absolute bottom-4 right-4 z-10 text-[10px] uppercase tracking-widest text-white bg-black/30 px-2 py-1 rounded backdrop-blur-sm">
                  After
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {viewMode === 'slider' && (
          <>
            <div className="absolute bottom-4 left-4 z-10 text-[10px] uppercase tracking-widest text-white bg-black/30 px-2 py-1 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
              Before
            </div>
            <div className="absolute bottom-4 right-4 z-10 text-[10px] uppercase tracking-widest text-white bg-black/30 px-2 py-1 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
              After
            </div>
          </>
        )}
      </div>

      {/* Mode Switcher */}
      <div className="flex justify-center">
        <div className="bg-white/50 backdrop-blur-sm p-1 rounded-full border border-beige-300 flex items-center gap-1 shadow-sm">
          <button 
            onClick={() => setViewMode('slider')}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all",
              viewMode === 'slider' ? "bg-brown-900 text-beige-100" : "text-brown-900/40 hover:text-brown-900/70"
            )}
          >
            <Split className="w-3 h-3" />
            Slider
          </button>
          <button 
            onClick={() => setViewMode('side-by-side')}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all",
              viewMode === 'side-by-side' ? "bg-brown-900 text-beige-100" : "text-brown-900/40 hover:text-brown-900/70"
            )}
          >
            <Columns className="w-3 h-3" />
            Side by Side
          </button>
        </div>
      </div>
    </div>
  );
}
