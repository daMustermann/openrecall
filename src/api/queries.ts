import { useQuery, useMutation } from '@tanstack/react-query'
import { apiClient } from './client'

// Query keys
export const queryKeys = {
  entries: ['entries'] as const,
  events: ['events'] as const,
}

// Get all entries
export function useEntries() {
  return useQuery({
    queryKey: queryKeys.entries,
    queryFn: apiClient.getEntries,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Toggle pause mutation
export function useTogglePause() {
  return useMutation({
    mutationFn: apiClient.togglePause,
    onSuccess: (data) => {
      // Could invalidate queries or update state here
      console.log('Recording toggled:', data.paused ? 'paused' : 'resumed')
    },
  })
}

// Get events
export function useEvents(limit = 50, offset = 0) {
  return useQuery({
    queryKey: [...queryKeys.events, limit, offset],
    queryFn: () => apiClient.getEvents(limit, offset),
    staleTime: 1000 * 60, // 1 minute
  })
}

// Run job mutation
export function useRunJob() {
  return useMutation({
    mutationFn: apiClient.runJob,
  })
}

