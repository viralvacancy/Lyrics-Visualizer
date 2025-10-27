
const LRC_PREFIX = 'gemini-lrc-';

export const saveLrc = (filename: string, lrcContent: string): void => {
  try {
    localStorage.setItem(LRC_PREFIX + filename, lrcContent);
  } catch (error) {
    console.error('Error saving LRC to localStorage:', error);
  }
};

export const loadLrc = (filename: string): string | null => {
  try {
    return localStorage.getItem(LRC_PREFIX + filename);
  } catch (error) {
    console.error('Error loading LRC from localStorage:', error);
    return null;
  }
};
