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
    <div className="bg-gray-800/50 rounded-lg p-4 flex flex-col h-full overflow-hidden border border-gray-700/50">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-gray-200 font-orbitron">Playlist</h2>
        <div className="flex items-center gap-2">
            <button onClick={onAddMore} className="text-gray-400 hover:text-green-500 transition-colors p-1 rounded-full" title="Add More Songs">
                <PlusIcon className="w-5 h-5" />
            </button>
            <button onClick={onClear} disabled={tracks.length === 0} className="text-gray-400 hover:text-red-500 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors p-1 rounded-full" title="Clear Playlist">
                <TrashIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
      <div className="overflow-y-auto flex-grow pr-2 -mr-2">
        {tracks.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Your playlist is empty.</p>
          </div>
        )}
        {tracks.map((track, index) => {
          const isActive = index === currentTrackIndex;
          return (
            <button
              key={index}
              onClick={() => onSelectTrack(index)}
              className={`w-full text-left p-3 rounded-md mb-2 flex items-center justify-between gap-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                isActive
                  ? 'bg-purple-600/50 text-white shadow-lg shadow-purple-500/20'
                  : 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <MusicNoteIcon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-pink-300' : 'text-gray-400'}`} />
                <span className="truncate flex-grow">{track.name}</span>
              </div>
              <div className="flex-shrink-0 flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); onEditTrack(index); }} className="p-1.5 text-gray-400 hover:text-blue-400 rounded-full transition-colors" title="Edit Lyrics">
                      <PencilIcon className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onDownloadTrack(index); }} className="p-1.5 text-gray-400 hover:text-green-400 rounded-full transition-colors" title="Download .lrc file">
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