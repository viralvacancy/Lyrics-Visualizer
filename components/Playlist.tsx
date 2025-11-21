import React from 'react';
import type { Track } from '../types';
import { MusicNoteIcon, TrashIcon, PlusIcon, PencilIcon, DownloadIcon } from './Icons';

interface PlaylistProps {
  tracks: Track[];
  currentTrackIndex: number | null;
  onSelectTrack: (index: number) => void;
  onClear: () => void;
  onAddMore: () => void;
  onEditTrack: (index: number) => void;
  onDownloadTrack: (index: number) => void;
}

const Playlist: React.FC<PlaylistProps> = ({ tracks, currentTrackIndex, onSelectTrack, onClear, onAddMore, onEditTrack, onDownloadTrack }) => {
  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      <div className="p-5 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-bold text-gray-100 font-orbitron tracking-widest uppercase flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                Playlist
            </h2>
            <div className="flex items-center gap-1">
                <button onClick={onAddMore} className="text-gray-400 hover:text-white hover:bg-white/10 transition-all p-1.5 rounded-md group" title="Add More Songs">
                    <PlusIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
                <button onClick={onClear} disabled={tracks.length === 0} className="text-gray-400 hover:text-red-400 hover:bg-red-400/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all p-1.5 rounded-md group" title="Clear Playlist">
                    <TrashIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
            </div>
        </div>
        <div className="flex justify-between items-end">
            <p className="text-xs text-gray-500 font-medium">{tracks.length} TRACKS</p>
        </div>
      </div>

      <div className="overflow-y-auto flex-grow p-3 custom-scrollbar space-y-1">
        {tracks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-gray-600 gap-3 mt-10">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                <MusicNoteIcon className="w-8 h-8 opacity-40" />
            </div>
            <p className="text-sm font-medium">Queue is empty</p>
          </div>
        )}
        {tracks.map((track, index) => {
          const isActive = index === currentTrackIndex;
          return (
            <div
              key={index}
              onClick={() => onSelectTrack(index)}
              className={`group relative w-full text-left p-3 rounded-lg flex items-center justify-between gap-3 transition-all duration-300 cursor-pointer border ${
                isActive
                  ? 'bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)] translate-x-1'
                  : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/10 hover:translate-x-1'
              }`}
            >
              <div className="flex items-center gap-4 truncate flex-grow">
                {isActive ? (
                    <div className="w-4 h-4 flex items-end justify-center gap-0.5">
                        <div className="w-1 bg-purple-400 animate-[bounce_1s_infinite] h-2"></div>
                        <div className="w-1 bg-purple-400 animate-[bounce_1.2s_infinite] h-3"></div>
                        <div className="w-1 bg-purple-400 animate-[bounce_0.8s_infinite] h-1.5"></div>
                    </div>
                ) : (
                    <span className="text-xs text-gray-600 font-mono w-4 text-center group-hover:text-gray-400 transition-colors">{index + 1}</span>
                )}
                <div className="flex flex-col truncate">
                    <span className={`truncate text-sm font-medium transition-colors ${isActive ? 'text-purple-200' : 'text-gray-300 group-hover:text-white'}`}>{track.name}</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium group-hover:text-gray-400">Local Audio</span>
                </div>
              </div>
              
              <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onEditTrack(index); }} 
                    className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors" 
                    title="Edit Lyrics"
                  >
                      <PencilIcon className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDownloadTrack(index); }} 
                    className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-400/10 rounded-md transition-colors" 
                    title="Download .lrc"
                  >
                      <DownloadIcon className="w-3.5 h-3.5" />
                  </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Playlist;