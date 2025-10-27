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
    <div className="bg-black text-white h-screen flex flex-col font-sans overflow-hidden">
      <main className="flex-grow flex relative">
        <div className="w-full h-full flex flex-col lg:flex-row">
            <div className="flex-grow relative">
              <LyricVisualizer track={currentTrack} visualMode={visualMode} />
              {showUploader && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-8">
                  <div className="w-full max-w-lg">
                    <FileUpload onFilesSelected={handleFilesSelected} disabled={isLoading} />
                  </div>
                </div>
              )}
               {isLoading && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8 z-50">
                      <LoadingSpinner />
                      <p className="mt-4 text-lg text-gray-300 font-orbitron">{loadingMessage}</p>
                  </div>
                )}
            </div>
            <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 bg-gray-900/70 backdrop-blur-lg border-l border-gray-700/50 p-4">
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
        <div className="absolute top-4 left-4 z-10">
            <ModeSelector currentMode={visualMode} onModeChange={setVisualMode} />
        </div>
      </main>
      <footer className="flex-shrink-0">
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
  );
}

export default App;
