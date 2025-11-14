const STORAGE_KEY = 'geminiApiKey';

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const getStoredApiKey = (): string => {
  if (!isBrowser()) {
    return '';
  }
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? '';
  } catch (error) {
    console.error('Failed to read API key from storage:', error);
    return '';
  }
};

export const saveApiKey = (apiKey: string) => {
  if (!isBrowser()) {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, apiKey);
  } catch (error) {
    console.error('Failed to save API key to storage:', error);
  }
};

export const clearStoredApiKey = () => {
  if (!isBrowser()) {
    return;
  }
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear API key from storage:', error);
  }
};

