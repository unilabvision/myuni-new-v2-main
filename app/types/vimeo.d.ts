// types/vimeo.d.ts

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

// Main event data interface - matches what Vimeo actually returns
export interface VimeoEventData {
  seconds: number;
  percent?: number;  // Optional because not all events include this
  duration?: number; // Optional because not all events include this
}

// You can keep this for backward compatibility if needed elsewhere
export interface VimeoTimeUpdateData {
  seconds: number;
  percent: number;
  duration: number;
}

export interface VimeoPlayerOptions {
  id?: string | number;
  url?: string;
  width?: number;
  height?: number;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  responsive?: boolean;
  [key: string]: unknown;
}

declare global {
  interface Window {
    Vimeo?: {
      Player: new (element: HTMLIFrameElement, options?: VimeoPlayerOptions) => VimeoPlayer;
    };
  }
}

export {};