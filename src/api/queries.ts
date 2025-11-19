import { useQuery, useMutation } from '@tanstack/react-query'
import { apiClient } from './client'

// Query keys
export const queryKeys = {
  entries: ['entries'] as const,
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
