// types/global.d.ts

export interface VimeoEventData {
  seconds: number;
  percent?: number;
  duration?: number;
  [key: string]: unknown;
}

export interface VimeoPlayerOptions {
  id?: number;
  url?: string;
  width?: number;
  height?: number;
  autopause?: boolean;
  autoplay?: boolean;
  background?: boolean;
  byline?: boolean;
  color?: string;
  controls?: boolean;
  dnt?: boolean;
  keyboard?: boolean;
  loop?: boolean;
  maxheight?: number;
  maxwidth?: number;
  muted?: boolean;
  pip?: boolean;
  playsinline?: boolean;
  portrait?: boolean;
  quality?: 'auto' | '240p' | '360p' | '540p' | '720p' | '1080p' | '2k' | '4k';
  responsive?: boolean;
  speed?: boolean;
  title?: boolean;
  transparent?: boolean;
  [key: string]: unknown;
}

export interface VimeoPlayer {
  getDuration(): Promise<number>;
  getCurrentTime(): Promise<number>;
  setCurrentTime(seconds: number): Promise<void>;
  on(event: string, callback: (data: VimeoEventData) => void): void;
  off(event: string, callback?: (data: VimeoEventData) => void): void;
  play(): Promise<void>;
  pause(): Promise<void>;
  destroy(): void; // Added missing destroy method
}

declare global {
  interface Window {
    Vimeo?: {
      Player: new (element: HTMLIFrameElement, options?: VimeoPlayerOptions) => VimeoPlayer;
    };
  }
}

export {};