import React from 'react';
import type { VisualMode } from '../types';

interface ModeSelectorProps {
  currentMode: VisualMode;
  onModeChange: (mode: VisualMode) => void;
}

const modes: { id: VisualMode; name: string }[] = [
  { id: 'aurora', name: 'Aurora' },
  { id: 'ember', name: 'Ember' },
  { id: 'neon', name: 'Neon' },
  { id: 'kinetic', name: 'Kinetic' },
  { id: 'focus', name: 'Focus' },
  { id: 'terminal', name: 'Terminal' },
];

const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onModeChange }) => {
  return (
    <div className="flex items-center bg-black/40 backdrop-blur-2xl border border-white/10 rounded-full p-1.5 shadow-[0_15px_35px_rgba(10,0,40,0.35)]">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onModeChange(mode.id)}
          className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400/70 focus:ring-offset-2 focus:ring-offset-slate-950 ${
            currentMode === mode.id
              ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-[0_10px_30px_rgba(168,85,247,0.45)]'
              : 'text-gray-200 hover:bg-white/10 hover:text-white'
          }`}
        >
          {mode.name}
        </button>
      ))}
    </div>
  );
};

export default ModeSelector;