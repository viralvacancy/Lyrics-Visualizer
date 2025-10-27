
import type { LyricLine } from '../types';

const lrcRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

export const parseLrc = (lrcContent: string): LyricLine[] => {
  if (!lrcContent) return [];

  const lines = lrcContent.split('\n');
  const parsedLines: LyricLine[] = [];

  for (const line of lines) {
    const match = lrcRegex.exec(line.trim());
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = parseInt(match[3].padEnd(3, '0'), 10);
      const text = match[4].trim();

      const time = minutes * 60 + seconds + milliseconds / 1000;
      if (text) {
        parsedLines.push({ time, text });
      }
    }
  }
  
  // Sort by time just in case the LRC file is not ordered
  return parsedLines.sort((a, b) => a.time - b.time);
};
