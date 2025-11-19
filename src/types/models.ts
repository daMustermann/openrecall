// Core data models derived from backend database.py and app.py

export interface Entry {
  id: number;
  app: string;
  title: string;
  text: string;
  timestamp: number; // Unix seconds
  embedding?: number[]; // float32[], optional if backend doesn't provide
  language: string;
}

export interface EntriesResponse extends Array<Entry> {}

export interface PauseResponse {
  paused: boolean;
}

// Search and filtering
export interface SearchFilters {
  q?: string;
  app?: string;
  language?: string;
  start?: number; // unix seconds
  end?: number;   // unix seconds
  eventType?: EventType;
  mood?: 'pos' | 'neg' | 'neu';
}

// Event clustering
export type EventType = 'coding' | 'gaming' | 'video' | 'browsing' | 'meeting' | 'other';

export interface Event {
  id: string; // generated UUID
  type: EventType;
  title: string; // auto-generated summary
  description: string; // AI-generated summary
  startTime: number;
  endTime: number;
  duration: number; // seconds
  entries: Entry[];
  heroImage: string; // path to representative screenshot
  thumbnails: string[]; // paths to key moment screenshots
  apps: string[];
  stats: EventStats;
  tags: string[]; // AI-generated tags
}

export interface EventStats {
  screenshotCount: number;
  topApps: Array<[string, number]>;
  wordCount: number;
  topWords: Array<[string, number]>;
  // Gaming specific
  gameName?: string;
  playtime?: number;
  kills?: number;
  score?: number;
  // Coding specific
  linesOfCode?: number;
  languages?: string[];
  gitCommits?: number;
  // Video specific
  videoTitle?: string;
  platform?: string;
  watchTime?: number;
}

// Dashboard stats
export interface DailyStats {
  date: string;
  totalScreenshots: number;
  totalEvents: number;
  productivityScore: number; // 0-100
  moodScore: number; // -1 to 1
  topApps: Array<[string, number]>;
  topWords: Array<[string, number]>;
  eventsByType: Record<EventType, number>;
  activityHeatmap: Array<[number, number]>; // [hour, count]
}

// Search results
export interface SearchResult {
  entry: Entry;
  score: number;
  highlights: string[]; // highlighted text snippets
  event?: Event; // if part of clustered event
}

// Ollama integration
export interface OllamaResponse {
  response: string;
  done: boolean;
}

export interface EmbeddingRequest {
  model: string; // 'llama3.1' or 'phi3'
  prompt: string;
}

export interface EmbeddingResponse {
  embedding: number[];
}

// Export formats
export interface ExportOptions {
  format: 'pdf' | 'obsidian';
  includeImages: boolean;
  includeOCR: boolean;
  dateRange?: [number, number];
  eventIds?: string[];
}

// UI state
export interface OmnibarState {
  isOpen: boolean;
  query: string;
  results: SearchResult[];
  selectedIndex: number;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentIndex: number;
  speed: number; // 0.5, 1, 2, etc.
  entries: Entry[];
}
