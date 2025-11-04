import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyIcon } from './Icons';
import { clearStoredApiKey, getStoredApiKey, saveApiKey } from '../utils/apiKeyStorage';

const maskKey = (value: string) => {
  if (!value) {
    return '';
  }
  if (value.length <= 6) {
    return '*'.repeat(value.length);
  }
  return `${value.slice(0, 3)}${'*'.repeat(Math.max(0, value.length - 6))}${value.slice(-3)}`;
};

const ApiKeySettings: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [draftKey, setDraftKey] = useState('');
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [feedback, setFeedback] = useState<'saved' | 'cleared' | 'error' | ''>('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = getStoredApiKey();
    setDraftKey(stored);
    setHasSavedKey(Boolean(stored));
  }, []);

  useEffect(() => {
    const hideFloatingButton = () => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const floating = buttons.find((button) => {
        if (!button.textContent?.toLowerCase().includes('api key')) {
          return false;
        }
        return !containerRef.current?.contains(button);
      });
      if (floating) {
        const parent = floating.parentElement as HTMLElement | null;
        if (parent) {
          parent.style.display = 'none';
        } else {
          (floating as HTMLElement).style.display = 'none';
        }
      }
    };

    hideFloatingButton();

    const observer = new MutationObserver(() => hideFloatingButton());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setShowKey(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const maskedValue = useMemo(() => maskKey(draftKey), [draftKey]);

  const handleSave = () => {
    const trimmed = draftKey.trim();
    if (!trimmed) {
      setFeedback('error');
      setHasSavedKey(false);
      clearStoredApiKey();
      return;
    }

    saveApiKey(trimmed);
    setFeedback('saved');
    setHasSavedKey(true);
  };

  const handleClear = () => {
    clearStoredApiKey();
    setDraftKey('');
    setHasSavedKey(false);
    setFeedback('cleared');
    setShowKey(false);
  };

  const toggleVisibility = () => setShowKey((prev) => !prev);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 ${
          hasSavedKey
            ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25 focus:ring-emerald-400/50'
            : 'border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 focus:ring-purple-400/70'
        }`}
        title={hasSavedKey ? 'API key saved' : 'Configure Gemini API key'}
      >
        <span className="flex items-center justify-center rounded-full bg-black/40 p-1">
          <KeyIcon className="h-4 w-4" />
        </span>
        <span>{hasSavedKey ? 'API Key Ready' : 'Configure API Key'}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-3 w-80 rounded-2xl border border-white/10 bg-slate-950/95 p-4 shadow-[0_20px_45px_rgba(15,10,60,0.45)] backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/90">Gemini API Key</p>
              <p className="text-xs text-gray-300">Stored securely in your browser.</p>
            </div>
            {hasSavedKey && (
              <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-200">
                Active
              </span>
            )}
          </div>

          <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-gray-300">
            API Key
          </label>
          <div className="relative mb-3">
            <input
              type={showKey ? 'text' : 'password'}
              value={draftKey}
              onChange={(event) => setDraftKey(event.target.value)}
              placeholder="Paste your Gemini API key"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:border-purple-500/60 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
            />
            {draftKey && (
              <button
                type="button"
                onClick={toggleVisibility}
                className="absolute inset-y-0 right-2 flex items-center text-xs text-purple-200 hover:text-purple-100"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            )}
          </div>

          <div className="mb-3 rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-xs text-gray-300">
            {hasSavedKey ? (
              <span>Saved key: {showKey ? draftKey : maskedValue}</span>
            ) : (
              <span>No key saved. Paste your Gemini API key and save it.</span>
            )}
          </div>

          {feedback === 'error' && (
            <p className="mb-2 text-xs font-medium text-red-300">Please enter a valid API key before saving.</p>
          )}
          {feedback === 'saved' && (
            <p className="mb-2 text-xs font-medium text-emerald-300">API key saved. You can now generate lyrics.</p>
          )}
          {feedback === 'cleared' && (
            <p className="mb-2 text-xs font-medium text-amber-300">API key removed. Uploading audio will require a key.</p>
          )}

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleClear}
              className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-gray-300 transition-colors duration-200 hover:bg-white/10 hover:text-white"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white shadow-[0_10px_30px_rgba(147,51,234,0.35)] transition-transform duration-200 hover:scale-[1.01]"
            >
              Save API Key
            </button>
          </div>

          <p className="mt-3 text-[0.65rem] leading-relaxed text-gray-400">
            Your key is stored locally and sent only when calling the transcription service. Remove it when you are finished.
          </p>
        </div>
      )}
    </div>
  );
};

export default ApiKeySettings;
