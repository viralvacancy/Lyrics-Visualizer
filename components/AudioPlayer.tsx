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
  
  if (!track) return <div className="h-[96px] bg-gray-900/30 backdrop-blur-sm border-t border-gray-700/50 flex items-center justify-center text-gray-500">No track selected.</div>;

  return (
    <div className="h-[96px] bg-gray-900/30 backdrop-blur-sm border-t border-gray-700/50 p-4 flex items-center gap-4 text-white">
      <audio ref={audioRef} />
      <div className="w-16 h-16 bg-gray-700 rounded-md flex-shrink-0"></div>
      <div className="flex-grow flex flex-col justify-center gap-1 min-w-0">
        <p className="font-semibold truncate">{track.name}</p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm accent-purple-500"
          />
          <span className="text-xs text-gray-400">{formatTime(duration)}</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={togglePlayPause} className="p-2 rounded-full bg-purple-600 hover:bg-purple-500 transition-colors">
          {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
        </button>
        <div className="flex items-center gap-2">
            <button onClick={toggleMute}>
                {isMuted || volume === 0 ? <VolumeMuteIcon className="w-6 h-6 text-gray-400" /> : <VolumeUpIcon className="w-6 h-6 text-gray-400" />}
            </button>
            <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm accent-purple-500"
            />
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
