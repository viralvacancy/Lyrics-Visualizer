
const LRC_PREFIX = 'gemini-lrc-';
const API_KEY_STORAGE_KEY = 'gemini-api-key';

const getStorage = (): Storage | null => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  return window.localStorage;
};

export const saveLrc = (filename: string, lrcContent: string): void => {
  try {
    const storage = getStorage();
    storage?.setItem(LRC_PREFIX + filename, lrcContent);
  } catch (error) {
    console.error('Error saving LRC to localStorage:', error);
  }
};

export const loadLrc = (filename: string): string | null => {
  try {
    const storage = getStorage();
    return storage ? storage.getItem(LRC_PREFIX + filename) : null;
  } catch (error) {
    console.error('Error loading LRC from localStorage:', error);
    return null;
  }
};

export const saveApiKeyToStorage = (apiKey: string): void => {
  try {
    const storage = getStorage();
    storage?.setItem(API_KEY_STORAGE_KEY, apiKey);
  } catch (error) {
    console.error('Error saving API key to localStorage:', error);
  }
};

export const loadApiKeyFromStorage = (): string | null => {
  try {
    const storage = getStorage();
    return storage ? storage.getItem(API_KEY_STORAGE_KEY) : null;
  } catch (error) {
    console.error('Error loading API key from localStorage:', error);
    return null;
  }
};

export const clearStoredApiKey = (): void => {
  try {
    const storage = getStorage();
    storage?.removeItem(API_KEY_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing API key from localStorage:', error);
  }
};
