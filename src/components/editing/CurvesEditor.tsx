import React, { useRef, useEffect, useState } from 'react';
import { Point } from '../../types';
import { motion } from 'motion/react';

interface CurvesEditorProps {
  points: Point[];
  onChange: (points: Point[]) => void;
}

export default function CurvesEditor({ points, onChange }: CurvesEditorProps) {
  const containerRef = useRef<SVGSVGElement>(null);
  const [activePoint, setActivePoint] = useState<number | null>(null);

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    return {
      x: (clientX - rect.left) / rect.width,
      y: 1 - (clientY - rect.top) / rect.height
    };
  };

  const handleMouseDown = (index: number) => {
    setActivePoint(index);
  };

  const handleMouseMove = (e: any) => {
    if (activePoint === null) return;
    
    const { x, y } = getCanvasCoords(e);
    const newPoints = [...points];
    
    // Constraints
    let newX = Math.min(Math.max(x, 0), 1);
    const newY = Math.min(Math.max(y, 0), 1);

    // Keep points in order
    if (activePoint > 0) newX = Math.max(newX, points[activePoint - 1].x + 0.01);
    if (activePoint < points.length - 1) newX = Math.min(newX, points[activePoint + 1].x - 0.01);
    
    // Don't allow moving end points X coord
    if (activePoint === 0) newX = 0;
    if (activePoint === points.length - 1) newX = 1;

    newPoints[activePoint] = { x: newX, y: newY };
    onChange(newPoints);
  };

  const handleMouseUp = () => {
    setActivePoint(null);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    const { x, y } = getCanvasCoords(e);
    const newPoints = [...points, { x, y }].sort((a, b) => a.x - b.x);
    onChange(newPoints);
  };

  const removePoint = (index: number) => {
    if (index === 0 || index === points.length - 1) return;
    const newPoints = points.filter((_, i) => i !== index);
    onChange(newPoints);
  };

  // Generate path string for curve
  const generatePath = () => {
    if (points.length < 2) return '';
    const sorted = [...points].sort((a, b) => a.x - b.x);
    let path = `M ${sorted[0].x * 100} ${(1 - sorted[0].y) * 100}`;
    
    for (let i = 1; i < sorted.length; i++) {
      path += ` L ${sorted[i].x * 100} ${(1 - sorted[i].y) * 100}`;
    }
    return path;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <span className="text-[10px] uppercase tracking-widest font-bold text-brown-900/40">Curves</span>
        <button 
          onClick={() => onChange([{ x: 0, y: 0 }, { x: 1, y: 1 }])}
          className="text-[10px] uppercase font-bold text-brown-900/40 hover:text-brown-900 transition-colors"
        >
          Reset
        </button>
      </div>
      
      <div className="relative aspect-square bg-beige-100 rounded-xl border border-beige-300 overflow-hidden select-none touch-none">
        {/* Grid lines */}
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <React.Fragment key={i}>
              <div className="border-r border-beige-300/30 w-full h-full" />
              <div className="border-b border-beige-300/30 w-full h-full" />
            </React.Fragment>
          ))}
        </div>

        <svg
          ref={containerRef}
          viewBox="0 0 100 100"
          className="w-full h-full cursor-crosshair"
          onMouseMove={handleMouseMove}
          onTouchMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchEnd={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
        >
          <path
            d={generatePath()}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-brown-900"
          />
          
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x * 100}
              cy={(1 - p.y) * 100}
              r={activePoint === i ? "4" : "3"}
              className={cn(
                "fill-white stroke-brown-900 stroke-2 cursor-grab active:cursor-grabbing transition-transform",
                activePoint === i && "scale-125"
              )}
              onMouseDown={() => handleMouseDown(i)}
              onTouchStart={() => handleMouseDown(i)}
              onContextMenu={(e) => {
                e.preventDefault();
                removePoint(i);
              }}
            />
          ))}
        </svg>
      </div>
      <p className="text-[9px] text-brown-900/40 uppercase font-medium text-center">Double click to add point • Right click to remove</p>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
