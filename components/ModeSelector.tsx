
import React from 'react';
import type { VisualizerSettings, VisualizerPalette, BackgroundEffect } from '../types';

interface VisualizerControlsProps {
  settings: VisualizerSettings;
  onSettingsChange: (settings: VisualizerSettings) => void;
}

const palettes: { id: VisualizerPalette; name: string; colors: string }[] = [
  { id: 'cyber', name: 'CYBER', colors: 'bg-gradient-to-r from-cyan-400 to-purple-500' },
  { id: 'sunset', name: 'SUNSET', colors: 'bg-gradient-to-r from-orange-400 to-red-500' },
  { id: 'matrix', name: 'MATRIX', colors: 'bg-gradient-to-r from-green-400 to-green-700' },
  { id: 'ocean', name: 'OCEAN', colors: 'bg-gradient-to-r from-blue-400 to-teal-400' },
];

const effects: { id: BackgroundEffect; label: string }[] = [
    { id: 'none', label: 'None' },
    { id: 'stars', label: 'Stars' },
    { id: 'fluid', label: 'Fluid' },
    { id: 'grid', label: 'Grid' },
];

const VisualizerControls: React.FC<VisualizerControlsProps> = ({ settings, onSettingsChange }) => {
  
  const handlePaletteChange = (palette: VisualizerPalette) => {
      onSettingsChange({ ...settings, palette });
  };

  const handleEffectChange = (bgEffect: BackgroundEffect) => {
      onSettingsChange({ ...settings, bgEffect });
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl">
      
      {/* Palette Selector */}
      <div className="flex items-center gap-2">
          <span className="text-[10px] font-orbitron text-gray-500 uppercase tracking-wider ml-1 mr-1">Palette</span>
          <div className="flex bg-black/40 rounded-full p-1 border border-white/5">
            {palettes.map((p) => (
                <button
                key={p.id}
                onClick={() => handlePaletteChange(p.id)}
                className={`relative w-8 h-8 rounded-full transition-all duration-300 flex items-center justify-center overflow-hidden group ${
                    settings.palette === p.id ? 'ring-2 ring-white scale-110 z-10' : 'opacity-70 hover:opacity-100 hover:scale-105'
                }`}
                title={p.name}
                >
                    <div className={`absolute inset-0 ${p.colors}`}></div>
                    {settings.palette === p.id && <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm z-10"></div>}
                </button>
            ))}
          </div>
      </div>

      <div className="w-px h-8 bg-white/10 hidden sm:block"></div>

      {/* Background Effect Selector */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-orbitron text-gray-500 uppercase tracking-wider ml-1 mr-1">Background</span>
        <div className="flex bg-black/40 rounded-full p-1 border border-white/5">
            {effects.map((effect) => (
                <button 
                    key={effect.id}
                    onClick={() => handleEffectChange(effect.id)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                        settings.bgEffect === effect.id
                        ? 'bg-white/10 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.2)]' 
                        : 'bg-transparent text-gray-500 hover:text-gray-300'
                    }`}
                >
                    {effect.label}
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default VisualizerControls;
