
export interface Track {
  name: string;
  audioUrl: string;
  lrc: string;
}

export interface LyricLine {
  time: number;
  text: string;
}

export type VisualizerPalette = 'cyber' | 'sunset' | 'matrix' | 'ocean';
export type BackgroundEffect = 'none' | 'stars' | 'fluid' | 'grid';

export interface VisualizerSettings {
    palette: VisualizerPalette;
    bgEffect: BackgroundEffect;
}
