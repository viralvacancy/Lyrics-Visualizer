import React, { useState, useCallback } from 'react';
import type { Track } from '../types';
import LiveEditor from './LiveEditor';

interface LrcEditorModalProps {
  track: Track;
  onClose: () => void;
  onSave: (newLrc: string) => void;
}

const LrcEditorModal: React.FC<LrcEditorModalProps> = ({ track, onClose, onSave }) => {
  const [lrcContent, setLrcContent] = useState(track.lrc);

  const handleSave = () => {
    onSave(lrcContent);
  };

  const handleContentChange = useCallback((newContent: string) => {
    setLrcContent(newContent);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden border border-gray-700">
        <header className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-lg font-semibold text-white">Edit Lyrics for: <span className="font-bold text-purple-400">{track.name}</span></h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        </header>
        <main className="flex-grow overflow-hidden">
          <LiveEditor initialContent={lrcContent} onContentChange={handleContentChange} />
        </main>
        <footer className="p-4 border-t border-gray-700 flex justify-end gap-4 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-500 transition-colors"
          >
            Save Changes
          </button>
        </footer>
      </div>
    </div>
  );
};

export default LrcEditorModal;
