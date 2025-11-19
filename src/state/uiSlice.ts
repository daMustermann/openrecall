import { create } from 'zustand'
import { OmnibarState, PlaybackState } from '@/types/models'

interface UiState {
  // Omnibar
  omnibar: OmnibarState
  setOmnibarOpen: (open: boolean) => void
  setOmnibarQuery: (query: string) => void

  // Playback
  playback: PlaybackState
  setPlaybackPlaying: (playing: boolean) => void
  setPlaybackIndex: (index: number) => void
  setPlaybackSpeed: (speed: number) => void

  // General UI
  isLoading: boolean
  setLoading: (loading: boolean) => void

  // Modals/Dialogs
  showSettings: boolean
  setShowSettings: (show: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  // Omnibar
  omnibar: {
    isOpen: false,
    query: '',
    results: [],
    selectedIndex: 0,
  },
  setOmnibarOpen: (isOpen) =>
    set((state) => ({
      omnibar: { ...state.omnibar, isOpen }
    })),
  setOmnibarQuery: (query) =>
    set((state) => ({
      omnibar: { ...state.omnibar, query, selectedIndex: 0 }
    })),

  // Playback
  playback: {
    isPlaying: false,
    currentIndex: 0,
    speed: 1,
    entries: [],
  },
  setPlaybackPlaying: (isPlaying) =>
    set((state) => ({
      playback: { ...state.playback, isPlaying }
    })),
  setPlaybackIndex: (currentIndex) =>
    set((state) => ({
      playback: { ...state.playback, currentIndex }
    })),
  setPlaybackSpeed: (speed) =>
    set((state) => ({
      playback: { ...state.playback, speed }
    })),

  // General UI
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),

  // Modals
  showSettings: false,
  setShowSettings: (showSettings) => set({ showSettings }),
}))
