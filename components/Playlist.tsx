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
    <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent rounded-2xl p-5 lg:p-6 flex flex-col h-full overflow-hidden border border-white/10 shadow-[0_25px_60px_rgba(15,15,45,0.45)]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white font-orbitron tracking-[0.2em] uppercase">Playlist</h2>
        <div className="flex items-center gap-2">
            <button onClick={onAddMore} className="text-gray-300 hover:text-green-400 transition-all duration-300 p-1.5 rounded-full bg-white/5 hover:bg-white/10" title="Add More Songs">
                <PlusIcon className="w-5 h-5" />
            </button>
            <button onClick={onClear} disabled={tracks.length === 0} className="text-gray-300 hover:text-red-400 disabled:text-gray-600 disabled:cursor-not-allowed transition-all duration-300 p-1.5 rounded-full bg-white/5 hover:bg-white/10" title="Clear Playlist">
                <TrashIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
      <div className="overflow-y-auto flex-grow pr-2 -mr-2 space-y-3">
        {tracks.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm text-center px-4">
            <p>Upload a track to begin building your immersive lyric journey.</p>
          </div>
        )}
        {tracks.map((track, index) => {
          const isActive = index === currentTrackIndex;
          return (
            <button
              key={index}
              onClick={() => onSelectTrack(index)}
              className={`w-full text-left p-4 rounded-xl flex items-center justify-between gap-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400/70 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600/70 via-purple-500/40 to-pink-500/40 text-white shadow-[0_20px_40px_rgba(168,85,247,0.35)] hover:-translate-y-0.5'
                  : 'bg-white/5 text-gray-200 hover:bg-white/10 hover:-translate-y-0.5'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? 'bg-white/20' : 'bg-white/10'}`}>
                  <MusicNoteIcon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-pink-200' : 'text-gray-300'}`} />
                </div>
                <span className="truncate flex-grow font-medium tracking-wide">{track.name}</span>
              </div>
              <div className="flex-shrink-0 flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); onEditTrack(index); }} className="p-1.5 text-gray-300 hover:text-blue-300 rounded-full transition-colors" title="Edit Lyrics">
                      <PencilIcon className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onDownloadTrack(index); }} className="p-1.5 text-gray-300 hover:text-green-300 rounded-full transition-colors" title="Download .lrc file">
                      <DownloadIcon className="w-4 h-4" />
                  </button>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Playlist;