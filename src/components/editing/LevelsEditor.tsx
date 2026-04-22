import React from 'react';

interface LevelsEditorProps {
  levels: {
    blackIn: number;
    whiteIn: number;
    gamma: number;
    blackOut: number;
    whiteOut: number;
  };
  onChange: (levels: any) => void;
}

export default function LevelsEditor({ levels, onChange }: LevelsEditorProps) {
  const handleChange = (key: string, value: number) => {
    onChange({ ...levels, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <span className="text-[10px] uppercase tracking-widest font-bold text-brown-900/40 px-1">Input Levels</span>
        <div className="bg-beige-100 p-4 rounded-xl border border-beige-300 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-brown-900/60 uppercase">
              <span>Black Point</span>
              <span>{levels.blackIn}</span>
            </div>
            <input 
              type="range" min="0" max="255" value={levels.blackIn}
              onChange={(e) => handleChange('blackIn', parseInt(e.target.value))}
              className="w-full h-1 bg-beige-300 rounded-lg appearance-none cursor-pointer accent-brown-900"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-brown-900/60 uppercase">
              <span>Gamma (Midtones)</span>
              <span>{levels.gamma.toFixed(2)}</span>
            </div>
            <input 
              type="range" min="0.1" max="9.99" step="0.01" value={levels.gamma}
              onChange={(e) => handleChange('gamma', parseFloat(e.target.value))}
              className="w-full h-1 bg-beige-300 rounded-lg appearance-none cursor-pointer accent-brown-900"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-brown-900/60 uppercase">
              <span>White Point</span>
              <span>{levels.whiteIn}</span>
            </div>
            <input 
              type="range" min="0" max="255" value={levels.whiteIn}
              onChange={(e) => handleChange('whiteIn', parseInt(e.target.value))}
              className="w-full h-1 bg-beige-300 rounded-lg appearance-none cursor-pointer accent-brown-900"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-[10px] uppercase tracking-widest font-bold text-brown-900/40 px-1">Output Levels</span>
        <div className="bg-beige-100 p-4 rounded-xl border border-beige-300 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-brown-900/60 uppercase">
              <span>Min Output</span>
              <span>{levels.blackOut}</span>
            </div>
            <input 
              type="range" min="0" max="255" value={levels.blackOut}
              onChange={(e) => handleChange('blackOut', parseInt(e.target.value))}
              className="w-full h-1 bg-beige-300 rounded-lg appearance-none cursor-pointer accent-brown-900"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-brown-900/60 uppercase">
              <span>Max Output</span>
              <span>{levels.whiteOut}</span>
            </div>
            <input 
              type="range" min="0" max="255" value={levels.whiteOut}
              onChange={(e) => handleChange('whiteOut', parseInt(e.target.value))}
              className="w-full h-1 bg-beige-300 rounded-lg appearance-none cursor-pointer accent-brown-900"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
