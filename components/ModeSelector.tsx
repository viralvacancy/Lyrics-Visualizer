import React from 'react';
import type { VisualMode } from '../types';

interface ModeSelectorProps {
  currentMode: VisualMode;
  onModeChange: (mode: VisualMode) => void;
}

const modes: { id: VisualMode; name: string }[] = [
  { id: 'rain', name: 'Rain' },
  { id: 'ember', name: 'Ember' },
  { id: 'neon', name: 'Neon' },
  { id: 'kinetic', name: 'Kinetic' },
  { id: 'focus', name: 'Focus' },
  { id: 'terminal', name: 'Terminal' },
];

const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onModeChange }) => {
  return (
    <div className="flex items-center bg-gray-900/50 border border-gray-700 rounded-full p-1">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onModeChange(mode.id)}
          className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
            currentMode === mode.id
              ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.7)]'
              : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
          }`}
        >
          {mode.name}
        </button>
      ))}
    </div>
  );
};

export default ModeSelector;