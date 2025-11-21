
import React, { useState, useCallback, useEffect } from 'react';
import type { Track, VisualizerSettings } from './types';
import FileUpload from './components/FileUpload';
import Playlist from './components/Playlist';
import LyricVisualizer from './components/LyricVisualizer';
import AudioPlayer from './components/AudioPlayer';
import VisualizerControls from './components/ModeSelector'; // Repurposed component
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
  
  const [settings, setSettings] = useState<VisualizerSettings>({
      palette: 'cyber',
      bgEffect: 'stars'
  });

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
    <div className="bg-black text-white h-screen flex flex-col font-sans overflow-hidden relative selection:bg-purple-500/30">
      {/* Dynamic Ambient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900 via-black to-black"></div>
          <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] opacity-20 animate-gradient-xy"
               style={{
                   background: 'radial-gradient(circle at 50% 50%, rgba(76, 29, 149, 0.4), rgba(15, 23, 42, 0), rgba(0,0,0,0))',
                   backgroundSize: '100% 100%'
               }}>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black to-transparent"></div>
      </div>

      <main className="flex-grow flex relative z-10 overflow-hidden">
        <div className="w-full h-full flex flex-col lg:flex-row">
            <div className="flex-grow relative h-full overflow-hidden flex flex-col">
              {/* Visualizer Component */}
              <LyricVisualizer track={currentTrack} settings={settings} />
              
              {/* Controls Overlay */}
              <div className="absolute top-8 left-0 right-0 flex justify-center z-20 pointer-events-none">
                  <div className="pointer-events-auto animate-fade-in-down">
                    <VisualizerControls settings={settings} onSettingsChange={setSettings} />
                  </div>
              </div>

              {showUploader && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-xl flex items-center justify-center p-8 z-30">
                  <div className="w-full max-w-lg animate-fade-in-up">
                    <h1 className="text-5xl font-bold font-orbitron text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">GEMINI AUDIO</h1>
                    <p className="text-center text-gray-400 mb-10 tracking-wide text-sm">AI-POWERED LYRIC SYNCHRONIZATION & VISUALIZER</p>
                    <FileUpload onFilesSelected={handleFilesSelected} disabled={isLoading} />
                  </div>
                </div>
              )}
               {isLoading && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-8 z-50">
                      <LoadingSpinner />
                      <p className="mt-6 text-xl text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300 font-orbitron animate-pulse">{loadingMessage}</p>
                  </div>
                )}
            </div>
            
            {/* Sidebar Playlist */}
            <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 bg-black/40 backdrop-blur-xl border-l border-white/10 flex flex-col relative z-20">
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
      </main>
      
      <footer className="flex-shrink-0 relative z-50">
        <AudioPlayer track={currentTrack} onEnded={handleNextTrack} />
      </footer>

      {isEditorOpen && trackToEdit && (
        <LrcEditorModal
          track={trackToEdit.track}
          onClose={() => setIsEditorOpen(false)}
          onSave={(newLrc) => handleSaveLrc(trackToEdit.index, newLrc)}
        />
      )}
      <style>{`
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes fade-in-down {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
            animation: fade-in-down 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes gradient-xy {
            0% { transform: translate(0,0) rotate(0deg); }
            50% { transform: translate(-2%, 2%) rotate(2deg); }
            100% { transform: translate(0,0) rotate(0deg); }
        }
        .animate-gradient-xy {
            animation: gradient-xy 15s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default App;
