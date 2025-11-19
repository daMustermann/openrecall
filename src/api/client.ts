import { EntriesResponse, PauseResponse } from '@/types/models'

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
  }
}

// Ollama client for local AI
export const ollamaClient = {
  baseUrl: 'http://localhost:11434',

  async generateEmbedding(text: string, model = 'llama3.1'): Promise<number[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt: text })
      })

      if (!response.ok) {
        console.warn('Ollama not available, using fallback')
        return []
      }

      const data = await response.json()
      return data.embedding || []
    } catch (error) {
      console.warn('Ollama embedding failed:', error)
      return []
    }
  },

  async generateSummary(text: string, model = 'llama3.1'): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt: `Summarize this activity in 2-3 sentences: ${text}`,
          stream: false
        })
      })

      if (!response.ok) {
        return 'Summary not available (Ollama offline)'
      }

      const data = await response.json()
      return data.response || 'Summary not available'
    } catch (error) {
      console.warn('Ollama summary failed:', error)
      return 'Summary not available (Ollama offline)'
    }
  }
}
