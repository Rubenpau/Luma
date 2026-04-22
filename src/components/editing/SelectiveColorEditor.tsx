import React, { useState } from 'react';

interface SelectiveColorEditorProps {
  data: Record<string, {
    cyan: number;
    magenta: number;
    yellow: number;
    black: number;
  }>;
  onChange: (data: any) => void;
}

const COLORS = [
  { id: 'reds', label: 'Reds', color: '#ff0000' },
  { id: 'yellows', label: 'Yellows', color: '#ffff00' },
  { id: 'greens', label: 'Greens', color: '#00ff00' },
  { id: 'cyans', label: 'Cyans', color: '#00ffff' },
  { id: 'blues', label: 'Blues', color: '#0000ff' },
  { id: 'magentas', label: 'Magentas', color: '#ff00ff' },
  { id: 'whites', label: 'Whites', color: '#ffffff' },
  { id: 'neutrals', label: 'Neutrals', color: '#888888' },
  { id: 'blacks', label: 'Blacks', color: '#000000' },
];

export default function SelectiveColorEditor({ data, onChange }: SelectiveColorEditorProps) {
  const [selectedColor, setSelectedColor] = useState('reds');

  const updateChannel = (channel: string, value: number) => {
    onChange({
      ...data,
      [selectedColor]: {
        ...data[selectedColor],
        [channel]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {COLORS.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedColor(c.id)}
            className={`w-8 h-8 rounded-full border-2 transition-all ${
              selectedColor === c.id 
                ? 'border-brown-900 scale-110 shadow-md' 
                : 'border-white/20 hover:scale-105'
            }`}
            style={{ backgroundColor: c.color }}
            title={c.label}
          />
        ))}
      </div>

      <div className="bg-beige-100 p-4 rounded-xl border border-beige-300 space-y-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-brown-900 uppercase tracking-widest">Target: {COLORS.find(c => c.id === selectedColor)?.label}</span>
          <button 
            onClick={() => onChange({ ...data, [selectedColor]: { cyan: 0, magenta: 0, yellow: 0, black: 0 } })}
            className="text-[10px] uppercase font-bold text-brown-900/40 hover:text-brown-900"
          >
            Reset {COLORS.find(c => c.id === selectedColor)?.label}
          </button>
        </div>

        {['cyan', 'magenta', 'yellow', 'black'].map((channel) => (
          <div key={channel} className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-brown-900/60 uppercase">
              <span>{channel}</span>
              <span>{data[selectedColor][channel as keyof typeof data[string]]}%</span>
            </div>
            <input 
              type="range" min="-100" max="100" 
              value={data[selectedColor][channel as keyof typeof data[string]]}
              onChange={(e) => updateChannel(channel, parseInt(e.target.value))}
              className="w-full h-1 bg-beige-300 rounded-lg appearance-none cursor-pointer accent-brown-900"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
