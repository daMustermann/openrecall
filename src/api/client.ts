import { EntriesResponse, PauseResponse, Event } from '@/types/models'

// Base API client
const API_BASE = '/api'

export const apiClient = {
  // Get all entries
  async getEntries(): Promise<EntriesResponse> {
    const response = await fetch(`${API_BASE}/entries`)
    if (!response.ok) {
      throw new Error(`Failed to fetch entries: ${response.statusText}`)
    }
    return response.json()
  },

  // Pause/resume recording
  async togglePause(): Promise<PauseResponse> {
    const response = await fetch('/pause', { method: 'POST' })
    if (!response.ok) {
      throw new Error(`Failed to toggle pause: ${response.statusText}`)
    }
    return response.json()
  },

  // Get screenshot image
  getScreenshotUrl(timestamp: number): string {
    return `/static/${timestamp}.webp`
  },

  async getEvents(limit = 50, offset = 0): Promise<Event[]> {
    const response = await fetch(`${API_BASE}/events?limit=${limit}&offset=${offset}`)
    if (!response.ok) throw new Error('Failed to fetch events')
    return response.json()
  },

  async runJob(task: string): Promise<any> {
    const response = await fetch(`${API_BASE}/jobs/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task })
    })
    if (!response.ok) throw new Error('Failed to run job')
    return response.json()
  },

  async chat(query: string): Promise<{ response: string }> {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    })
    if (!response.ok) throw new Error('Chat failed')
    return response.json()
  }
}

// AI client using backend proxy
export const aiClient = {
  async generateEmbedding(_text: string): Promise<number[]> {
    return []
  },

  async generateSummary(text: string): Promise<string> {
    try {
      const response = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'summary',
          prompt: text
        })
      })

      if (!response.ok) {
        return 'Summary not available'
      }

      const data = await response.json()
      return data.response || 'Summary not available'
    } catch (error) {
      console.warn('AI summary failed:', error)
      return 'Summary not available'
    }
  },

  async generateTitle(text: string, eventType: string): Promise<string> {
    try {
      const response = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'title',
          prompt: text,
          eventType
        })
      })

      if (!response.ok) {
        return `${eventType} Session`
      }

      const data = await response.json()
      return data.response || `${eventType} Session`
    } catch (error) {
      console.warn('AI title failed:', error)
      return `${eventType} Session`
    }
  },

  // Config methods
  async getConfig(): Promise<any> {
    const response = await fetch(`${API_BASE}/config`)
    if (!response.ok) throw new Error('Failed to fetch config')
    return response.json()
  },

  async saveConfig(config: any): Promise<any> {
    const response = await fetch(`${API_BASE}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    })
    if (!response.ok) throw new Error('Failed to save config')
    return response.json()
  },

  async reindex(): Promise<any> {
    const response = await fetch(`${API_BASE}/reindex`, {
      method: 'POST'
    })
    if (!response.ok) throw new Error('Reindexing failed')
    return await response.json()
  },

  async fetchModels(): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE}/models`)
      if (!response.ok) return []
      const data = await response.json()
      return data.models || []
    } catch (error) {
      console.warn('Failed to fetch models:', error)
      return []
    }
  }
}
