import { create } from 'zustand'
import { Event, Entry, SearchFilters } from '@/types/models'

interface EventsState {
  // Raw entries from API
  entries: Entry[]
  setEntries: (entries: Entry[]) => void

  // Clustered events
  events: Event[]
  setEvents: (events: Event[]) => void

  // Current filters
  filters: SearchFilters
  setFilters: (filters: Partial<SearchFilters>) => void

  // Selected event for detail view
  selectedEvent: Event | null
  setSelectedEvent: (event: Event | null) => void

  // Search state
  isSearching: boolean
  setSearching: (searching: boolean) => void
}

export const useEventsStore = create<EventsState>((set) => ({
  entries: [],
  setEntries: (entries) => set({ entries }),

  events: [],
  setEvents: (events) => set({ events }),

  filters: {},
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    })),

  selectedEvent: null,
  setSelectedEvent: (selectedEvent) => set({ selectedEvent }),

  isSearching: false,
  setSearching: (isSearching) => set({ isSearching }),
}))
