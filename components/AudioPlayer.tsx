import React, { useState, useEffect, useRef } from 'react';
import { PlayIcon, PauseIcon, VolumeUpIcon, VolumeMuteIcon } from './Icons';
import type { Track } from '../types';

interface AudioPlayerProps {
  track: Track | null;
  onEnded: () => void;
}

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const AudioPlayer: React.FC<AudioPlayerProps> = ({ track, onEnded }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      if (track) {
        audio.src = track.audioUrl;
        audio.play().then(() => setIsPlaying(true)).catch(e => console.error("Audio play failed:", e));
      } else {
        audio.pause();
        audio.src = '';
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
      }
    }
  }, [track]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleVolumeChange = () => {
        setVolume(audio.volume);
        setIsMuted(audio.muted);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('volumechange', handleVolumeChange);

    return () => {
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', onEnded);
        audio.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [onEnded]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (audio && track) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play().catch(e => console.error("Audio play failed:", e));
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = Number(e.target.value);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    const audio = audioRef.current;
    if (audio) {
      audio.volume = newVolume;
      audio.muted = newVolume === 0;
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = !audio.muted;
    }
  };
  
  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  if (!track) return (
    <div className="h-[90px] bg-black/60 backdrop-blur-xl border-t border-white/10 flex items-center justify-center text-gray-500 font-orbitron text-sm tracking-wider z-50 relative">
        SELECT A TRACK TO BEGIN
    </div>
  );

  return (
    <div className="h-[90px] bg-black/40 backdrop-blur-2xl border-t border-white/10 px-6 py-2 flex items-center gap-6 text-white shadow-2xl relative z-50">
      <audio ref={audioRef} crossOrigin="anonymous" />
      
      {/* Album Art / Info */}
      <div className="flex items-center gap-4 w-1/4 min-w-[200px]">
          <div className="w-14 h-14 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center shadow-lg border border-white/10 flex-shrink-0 relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                 <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse"></div>
             </div>
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <p className="font-bold truncate text-white/90 text-sm lg:text-base tracking-wide">{track.name}</p>
            <p className="text-[10px] text-purple-400/80 font-orbitron tracking-widest uppercase">GEMINI AUDIO</p>
          </div>
      </div>

      {/* Controls & Scrubber */}
      <div className="flex-grow flex flex-col items-center justify-center gap-1 max-w-2xl mx-auto">
        <div className="flex items-center gap-6 mb-1">
           <button className="text-gray-400 hover:text-white transition-colors hover:scale-105">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                 <path d="M9.195 18.44c1.25.713 2.805-.19 2.805-1.629v-2.34l6.945 3.968c1.25.714 2.805-.188 2.805-1.628V8.688c0-1.44-1.555-2.342-2.805-1.628L12 11.03v-2.34c0-1.44-1.555-2.343-2.805-1.629l-7.108 4.062c-1.26.72-1.26 2.536 0 3.256l7.108 4.061z" />
               </svg>
           </button>

           <button 
             onClick={togglePlayPause} 
             className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 hover:bg-purple-50 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
           >
             {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5 ml-0.5" />}
           </button>

           <button className="text-gray-400 hover:text-white transition-colors hover:scale-105" onClick={onEnded}>
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                 <path d="M5.055 7.06c-1.25-.714-2.805.189-2.805 1.628v8.123c0 1.44 1.555 2.342 2.805 1.628L12 14.471v2.34c0 1.44 1.555 2.342 2.805 1.628l7.108-4.061c1.26-.72 1.26-2.536 0-3.256l-7.108-4.062c-1.25-.713-2.805.19-2.805 1.629v2.34L5.055 7.06z" />
               </svg>
           </button>
        </div>

        <div className="w-full flex items-center gap-3 text-xs font-medium text-gray-400">
          <span className="w-10 text-right tabular-nums font-mono">{formatTime(currentTime)}</span>
          <div className="relative flex-grow h-1.5 bg-gray-700/30 rounded-full group cursor-pointer overflow-visible">
             {/* Track */}
             <div className="absolute inset-0 bg-white/10 rounded-full"></div>
             {/* Buffered (Mock) */}
             <div className="absolute top-0 left-0 h-full bg-white/5 rounded-full w-[0%] transition-all duration-1000"></div>
             
             {/* Active Progress */}
             <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full group-hover:brightness-125 transition-all duration-100 shadow-[0_0_10px_rgba(168,85,247,0.5)]" 
                style={{ width: `${progressPercent}%` }}
             >
                {/* Thumb */}
                <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all scale-0 group-hover:scale-100"></div>
             </div>
             <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
             />
          </div>
          <span className="w-10 tabular-nums font-mono">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume */}
      <div className="w-1/4 flex justify-end items-center gap-3 min-w-[140px]">
        <button onClick={toggleMute} className="text-gray-400 hover:text-white transition-colors">
            {isMuted || volume === 0 ? <VolumeMuteIcon className="w-5 h-5" /> : <VolumeUpIcon className="w-5 h-5" />}
        </button>
        <div className="w-24 h-1.5 bg-gray-700/30 rounded-full relative group">
            <div className="absolute top-0 left-0 h-full bg-white/60 rounded-full group-hover:bg-white transition-all" style={{ width: `${isMuted ? 0 : volume * 100}%` }}></div>
            <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;