import React, { useEffect, useState } from 'react';

interface ApiKeyModalProps {
  isOpen: boolean;
  initialValue?: string;
  isPersisted: boolean;
  onSave: (apiKey: string, persist: boolean) => void;
  onClose: () => void;
  onClearStoredKey: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  initialValue = '',
  isPersisted,
  onSave,
  onClose,
  onClearStoredKey,
}) => {
  const [apiKey, setApiKey] = useState(initialValue);
  const [rememberKey, setRememberKey] = useState(isPersisted);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(initialValue);
      setRememberKey(isPersisted);
      setShowKey(false);
    }
  }, [initialValue, isPersisted, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      return;
    }
    onSave(trimmedKey, rememberKey);
  };

  const handleClear = () => {
    onClearStoredKey();
    setRememberKey(false);
    setApiKey('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
      <div className="w-full max-w-lg rounded-2xl bg-[#0b0118] p-6 shadow-2xl border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-2">Configure Gemini API Key</h2>
        <p className="text-sm text-gray-300 mb-4 leading-relaxed">
          Provide a Google Gemini API key to enable on-device transcription. The key is only used when
          transcribing audio files and is never sent anywhere other than Google&apos;s Gemini API.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="gemini-api-key" className="block text-sm font-medium text-gray-200 mb-2">
              Gemini API Key
            </label>
            <div className="relative">
              <input
                id="gemini-api-key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                autoComplete="off"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Enter your Gemini API key"
              />
              <button
                type="button"
                onClick={() => setShowKey((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-sm text-purple-300 hover:text-purple-100"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Treat this key like a password. Do not share it publicly or commit it to source control.
            </p>
          </div>

          <label className="flex items-start gap-3 text-sm text-gray-200">
            <input
              type="checkbox"
              checked={rememberKey}
              onChange={(event) => setRememberKey(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-400"
            />
            <span>
              Remember this key securely in this browser using local storage. Uncheck to use it only for this session.
            </span>
          </label>

          <div className="flex flex-wrap justify-between gap-3 pt-2">
            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-xl bg-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:bg-purple-400"
                disabled={!apiKey.trim()}
              >
                Save Key
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className={`text-sm font-medium ${isPersisted ? 'text-red-300 hover:text-red-200' : 'text-gray-500 cursor-not-allowed'}`}
              disabled={!isPersisted}
            >
              Remove stored key
            </button>
          </div>
        </form>
        <p className="mt-4 text-xs text-gray-400">
          Tip: You can create and manage Gemini API keys from the Google AI Studio dashboard. If you suspect your key has
          leaked, revoke it immediately and generate a new one.
        </p>
      </div>
    </div>
  );
};

export default ApiKeyModal;
