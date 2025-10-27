import React, { useState, useCallback, useEffect } from 'react';
import type { Track, VisualMode } from './types';
import FileUpload from './components/FileUpload';
import Playlist from './components/Playlist';
import LyricVisualizer from './components/LyricVisualizer';
import AudioPlayer from './components/AudioPlayer';
import ModeSelector from './components/ModeSelector';
import LrcEditorModal from './components/LrcEditorModal';
import { extractFilesFromArchive } from './services/archiveService';
import { transcribeAudio } from './services/geminiService';
import { saveLrc, loadLrc } from './utils/localStorage';
import { downloadLrcFile } from './utils/fileDownloader';
import { LoadingSpinner } from './components/Icons';

function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [visualMode, setVisualMode] = useState<VisualMode>('focus');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [trackToEdit, setTrackToEdit] = useState<{ index: number, track: Track } | null>(null);

  const processFiles = useCallback(async (files: File[]) => {
    setIsLoading(true);
    const newTracks: Track[] = [];
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setLoadingMessage(`Processing ${i + 1}/${files.length}: ${file.name}`);

        const cachedLrc = loadLrc(file.name);
        let lrc = cachedLrc;

        if (!lrc) {
            setLoadingMessage(`Transcribing ${file.name}... This may take a moment.`);
            try {
                lrc = await transcribeAudio(file);
                saveLrc(file.name, lrc);
            } catch (error) {
                console.error(`Failed to transcribe ${file.name}:`, error);
                lrc = `[00:00.00]Transcription failed for ${file.name}.`;
            }
        }
        
        newTracks.push({
            name: file.name,
            audioUrl: URL.createObjectURL(file),
            lrc: lrc,
        });
    }
    
    setTracks(prev => [...prev, ...newTracks]);
    if (currentTrackIndex === null && newTracks.length > 0) {
      setCurrentTrackIndex(0);
    }
    setIsLoading(false);
    setLoadingMessage('');
  }, [currentTrackIndex]);

  const handleFilesSelected = async (fileList: FileList) => {
    const files = Array.from(fileList);
    const audioFiles: File[] = [];
    const archiveFiles: File[] = [];

    files.forEach(file => {
      if (file.type.startsWith('audio/')) {
        audioFiles.push(file);
      } else if (file.name.match(/\.(zip|rar)$/i)) {
        archiveFiles.push(file);
      }
    });

    if (audioFiles.length > 0) {
      await processFiles(audioFiles);
    }
    
    for (const archive of archiveFiles) {
        setIsLoading(true);
        setLoadingMessage(`Extracting files from ${archive.name}...`);
        try {
            const extracted = await extractFilesFromArchive(archive);
            const extractedFiles = extracted.map(f => new File([f.blob], f.name, { type: f.blob.type }));
            await processFiles(extractedFiles);
        } catch (error) {
            console.error(`Error extracting from ${archive.name}:`, error);
            alert(`Error extracting from ${archive.name}: ${(error as Error).message}`);
        } finally {
            setIsLoading(false);
        }
    }
  };
  
  const handleSelectTrack = (index: number) => {
    setCurrentTrackIndex(index);
  };
  
  const handleClearPlaylist = () => {
    tracks.forEach(track => URL.revokeObjectURL(track.audioUrl));
    setTracks([]);
    setCurrentTrackIndex(null);
  };

  const handleNextTrack = () => {
    if (currentTrackIndex !== null) {
      const nextIndex = (currentTrackIndex + 1) % tracks.length;
      setCurrentTrackIndex(nextIndex);
    }
  };
  
  const handleOpenEditor = (index: number) => {
    setTrackToEdit({ index, track: tracks[index] });
    setIsEditorOpen(true);
  };

  const handleSaveLrc = (index: number, newLrc: string) => {
    const updatedTracks = [...tracks];
    updatedTracks[index].lrc = newLrc;
    setTracks(updatedTracks);
    saveLrc(updatedTracks[index].name, newLrc);
    setIsEditorOpen(false);
    setTrackToEdit(null);
  };

  const handleDownloadLrc = (index: number) => {
    const track = tracks[index];
    downloadLrcFile(track.name, track.lrc);
  };

  const currentTrack = currentTrackIndex !== null ? tracks[currentTrackIndex] : null;

  const [showUploader, setShowUploader] = useState(true);
  useEffect(() => {
    setShowUploader(tracks.length === 0 && !isLoading);
  }, [tracks, isLoading]);

  const openUploader = () => {
    setShowUploader(true);
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#05000f] via-[#12002c] to-[#03010a] text-white font-sans overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-24 w-[28rem] h-[28rem] bg-purple-600/30 blur-[120px] rounded-full animate-orbit-slow" />
        <div className="absolute bottom-[-10rem] right-[-8rem] w-[32rem] h-[32rem] bg-blue-500/25 blur-[140px] rounded-full animate-orbit-reverse" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(244,114,182,0.12),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0)_40%)]" />
      </div>
      <div className="relative z-10 h-screen flex flex-col">
        <main className="flex-grow flex relative px-4 pb-4 lg:px-6 lg:pb-6">
          <div className="w-full h-full flex flex-col lg:flex-row rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_40px_120px_rgba(90,0,180,0.18)] overflow-hidden">
              <div className="flex-grow relative">
                <LyricVisualizer track={currentTrack} visualMode={visualMode} />
                {showUploader && (
                  <div className="absolute inset-0 bg-black/75 backdrop-blur-xl flex items-center justify-center p-8">
                    <div className="w-full max-w-lg">
                      <FileUpload onFilesSelected={handleFilesSelected} disabled={isLoading} />
                    </div>
                  </div>
                )}
                 {isLoading && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-8 z-50">
                        <LoadingSpinner />
                        <p className="mt-4 text-lg text-gray-200 font-orbitron tracking-wide">{loadingMessage}</p>
                    </div>
                  )}
              </div>
              <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 bg-gradient-to-b from-white/10 via-white/5 to-transparent backdrop-blur-2xl border-l border-white/10 p-4 lg:p-6">
                 <Playlist
                   tracks={tracks}
                   currentTrackIndex={currentTrackIndex}
                   onSelectTrack={handleSelectTrack}
                   onClear={handleClearPlaylist}
                   onAddMore={openUploader}
                   onEditTrack={handleOpenEditor}
                   onDownloadTrack={handleDownloadLrc}
                 />
              </div>
          </div>
          <div className="absolute top-6 left-8 z-20">
              <ModeSelector currentMode={visualMode} onModeChange={setVisualMode} />
          </div>
        </main>
        <footer className="flex-shrink-0 px-4 pb-6 lg:px-6">
          <AudioPlayer track={currentTrack} onEnded={handleNextTrack} />
        </footer>

        {isEditorOpen && trackToEdit && (
          <LrcEditorModal
            track={trackToEdit.track}
            onClose={() => setIsEditorOpen(false)}
            onSave={(newLrc) => handleSaveLrc(trackToEdit.index, newLrc)}
          />
        )}
      </div>
      <style>{`
        @keyframes orbit-slow {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.8; }
          50% { transform: translate3d(60px, 40px, 0) scale(1.05); opacity: 1; }
        }
        @keyframes orbit-reverse {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.7; }
          50% { transform: translate3d(-80px, -60px, 0) scale(1.08); opacity: 0.9; }
        }
        .animate-orbit-slow { animation: orbit-slow 18s ease-in-out infinite; }
        .animate-orbit-reverse { animation: orbit-reverse 22s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

export default App;
