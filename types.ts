export interface Track {
  name: string;
  audioUrl: string;
  lrc: string;
}

export interface LyricLine {
  time: number;
  text: string;
}

export type VisualMode = 'aurora' | 'ember' | 'kinetic' | 'neon' | 'focus' | 'terminal';
