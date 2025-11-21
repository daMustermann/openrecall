import Fuse from 'fuse.js'
import { Event, SearchResult } from '@/types/models'
import { cosineSimilarity } from '@/lib/utils'
import { aiClient } from '@/api/client'

// In-memory search index
let fuseIndex: Fuse<any> | null = null
let eventsData: Event[] = []

export function buildSearchIndex(events: Event[]) {
  eventsData = events

  // Prepare searchable data
  const searchData = events.flatMap(event =>
    event.entries.map(entry => ({
      id: entry.id,
      eventId: event.id,
      app: entry.app,
      title: entry.title,
      text: entry.text,
      timestamp: entry.timestamp,
      language: entry.language,
      eventType: event.type,
      eventTitle: event.title,
      // For display
      entry,
      event,
    }))
  )

  // Configure Fuse.js for fuzzy search
  fuseIndex = new Fuse(searchData, {
    keys: [
      { name: 'app', weight: 0.3 },
      { name: 'title', weight: 0.4 },
      { name: 'text', weight: 0.5 },
      { name: 'eventTitle', weight: 0.2 },
    ],
    threshold: 0.4, // More lenient matching
    includeScore: true,
    includeMatches: true,
  })
}

export async function performSearch(query: string, events: Event[]): Promise<SearchResult[]> {
  if (!query.trim()) return []

  // Rebuild index if events changed
  if (events !== eventsData) {
    buildSearchIndex(events)
  }

  const results: SearchResult[] = []

  // 1. Fuzzy/Keyword search with Fuse.js
  if (fuseIndex) {
    const fuseResults = fuseIndex.search(query, { limit: 50 })

    for (const fuseResult of fuseResults) {
      const item = fuseResult.item
      const score = fuseResult.score || 1

      // Extract highlights from matches
      const highlights: string[] = []
      if (fuseResult.matches) {
        fuseResult.matches.forEach(match => {
          if (match.value) {
            highlights.push(match.value.slice(0, 200))
          }
        })
      }

      results.push({
        entry: item.entry,
        score: 1 - score, // Convert to similarity score (0-1)
        highlights,
        event: item.event,
      })
    }
  }

  // 2. Semantic search with embeddings (if available)
  try {
    const queryEmbedding = await aiClient.generateEmbedding(query)
    if (queryEmbedding.length > 0) {
      for (const event of events) {
        for (const entry of event.entries) {
          if (entry.embedding && entry.embedding.length > 0) {
            const similarity = cosineSimilarity(queryEmbedding, entry.embedding)
            if (similarity > 0.7) { // Semantic threshold
              results.push({
                entry,
                score: similarity,
                highlights: [entry.text.slice(0, 200)],
                event,
              })
            }
          }
        }
      }
    }
  } catch (error) {
    console.warn('Semantic search failed:', error)
  }

  // 3. Remove duplicates and sort by score
  const uniqueResults = results.filter((result, index, self) =>
    index === self.findIndex(r => r.entry.id === result.entry.id)
  )

  uniqueResults.sort((a, b) => b.score - a.score)

  return uniqueResults.slice(0, 20) // Limit results
}

// Advanced search with filters
export async function performAdvancedSearch(
  query: string,
  events: Event[],
  filters: {
    app?: string
    language?: string
    startTime?: number
    endTime?: number
    eventType?: string
  }
): Promise<SearchResult[]> {
  let filteredEvents = events

  // Apply filters
  if (filters.app) {
    filteredEvents = filteredEvents.filter(event =>
      event.apps.some(app => app.toLowerCase().includes(filters.app!.toLowerCase()))
    )
  }

  if (filters.eventType) {
    filteredEvents = filteredEvents.filter(event => event.type === filters.eventType)
  }

  if (filters.startTime || filters.endTime) {
    filteredEvents = filteredEvents.filter(event => {
      if (filters.startTime && event.endTime < filters.startTime) return false
      if (filters.endTime && event.startTime > filters.endTime) return false
      return true
    })
  }

  // Perform search on filtered events
  return await performSearch(query, filteredEvents)
}

// Quick suggestions based on recent activity
export function getSearchSuggestions(events: Event[]): string[] {
  const suggestions = new Set<string>()

  // Recent apps
  events.slice(0, 10).forEach(event => {
    event.apps.forEach(app => suggestions.add(app))
  })

  // Recent titles
  events.slice(0, 5).forEach(event => {
    suggestions.add(event.title)
  })

  // Common words from recent entries
  const recentEntries = events.slice(0, 3).flatMap(e => e.entries)
  const words = recentEntries
    .flatMap(entry => entry.text.split(/\s+/))
    .filter(word => word.length > 4)
    .slice(0, 20)

  words.forEach(word => suggestions.add(word))

  return Array.from(suggestions).slice(0, 8)
}
