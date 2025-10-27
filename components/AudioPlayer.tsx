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
  
  if (!track) return <div className="h-[110px] bg-gradient-to-r from-white/5 via-white/10 to-transparent backdrop-blur-2xl border border-white/10 rounded-2xl flex items-center justify-center text-gray-300 shadow-[0_25px_60px_rgba(5,5,25,0.45)]">No track selected.</div>;

  return (
    <div className="h-[110px] bg-gradient-to-r from-white/5 via-white/10 to-transparent backdrop-blur-2xl border border-white/10 rounded-2xl px-5 py-4 flex items-center gap-5 text-white shadow-[0_25px_60px_rgba(5,5,25,0.45)]">
      <audio ref={audioRef} />
      <div className="w-20 h-20 rounded-xl flex-shrink-0 bg-gradient-to-br from-purple-500/60 to-blue-500/40 shadow-[0_15px_35px_rgba(168,85,247,0.35)] flex items-center justify-center">
        <PlayIcon className="w-8 h-8 text-white/80" />
      </div>
      <div className="flex-grow flex flex-col justify-center gap-2 min-w-0">
        <p className="font-semibold truncate tracking-wide">{track.name}</p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-300 font-mono">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-500"
          />
          <span className="text-xs text-gray-300 font-mono">{formatTime(duration)}</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={togglePlayPause} className="p-3 rounded-full bg-gradient-to-br from-purple-600 to-purple-500 hover:from-purple-500 hover:to-pink-500 transition-all shadow-[0_10px_30px_rgba(168,85,247,0.35)]">
          {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
        </button>
        <div className="flex items-center gap-3">
            <button onClick={toggleMute} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                {isMuted || volume === 0 ? <VolumeMuteIcon className="w-6 h-6 text-gray-200" /> : <VolumeUpIcon className="w-6 h-6 text-gray-200" />}
            </button>
            <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-28 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-500"
            />
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
