import { Entry, Event, EventType } from '@/types/models'
import { cosineSimilarity, generateId } from '@/lib/utils'
import { ollamaClient } from '@/api/client'

// Feature extraction for clustering
export function extractFeatures(entries: Entry[]): Array<{
  entry: Entry
  features: number[]
  text: string
}> {
  return entries.map(entry => {
    const prevEntry = entries[entries.indexOf(entry) - 1]
    const timeDelta = prevEntry ? entry.timestamp - prevEntry.timestamp : 0
    const appChanged = prevEntry ? (entry.app !== prevEntry.app ? 1 : 0) : 0

    // Normalize time delta (0-1 scale, assuming max gap of 1 hour)
    const normalizedTimeDelta = Math.min(timeDelta / 3600, 1)

    // Title similarity (simple string similarity)
    const titleSim = prevEntry ?
      (entry.title === prevEntry.title ? 1 : 0.5) : 1

    // Embedding distance (if available)
    const embedDist = prevEntry && entry.embedding && prevEntry.embedding ?
      1 - cosineSimilarity(entry.embedding, prevEntry.embedding) : 0.5

    const features = [
      normalizedTimeDelta, // 0: time gap
      appChanged,          // 1: app change
      titleSim,           // 2: title similarity
      embedDist,          // 3: embedding distance
    ]

    return {
      entry,
      features,
      text: `${entry.app} ${entry.title} ${entry.text}`.toLowerCase()
    }
  })
}

// Simple DBSCAN-like clustering
export async function clusterEntries(
  featureData: Array<{ entry: Entry, features: number[], text: string }>,
  eps = 0.3,
  minSamples = 2
): Promise<Event[]> {
  const clusters: Entry[][] = []
  const visited = new Set<number>()
  const noise = new Set<number>()

  function distance(a: number[], b: number[]): number {
    // Weighted distance: time(0.4) + app(0.3) + title(0.2) + embed(0.1)
    const weights = [0.4, 0.3, 0.2, 0.1]
    return Math.sqrt(
      a.reduce((sum, val, i) => sum + weights[i] * Math.pow(val - b[i], 2), 0)
    )
  }

  function regionQuery(index: number): number[] {
    const neighbors: number[] = []
    for (let i = 0; i < featureData.length; i++) {
      if (distance(featureData[index].features, featureData[i].features) <= eps) {
        neighbors.push(i)
      }
    }
    return neighbors
  }

  function expandCluster(index: number, neighbors: number[], cluster: Entry[]): boolean {
    cluster.push(featureData[index].entry)

    for (let i = 0; i < neighbors.length; i++) {
      const neighborIndex = neighbors[i]

      if (!visited.has(neighborIndex)) {
        visited.add(neighborIndex)
        const neighborNeighbors = regionQuery(neighborIndex)

        if (neighborNeighbors.length >= minSamples) {
          neighbors.push(...neighborNeighbors.filter(n => !neighbors.includes(n)))
        }
      }

      if (!clusters.some(c => c.includes(featureData[neighborIndex].entry))) {
        cluster.push(featureData[neighborIndex].entry)
      }
    }

    return cluster.length >= minSamples
  }

  for (let i = 0; i < featureData.length; i++) {
    if (visited.has(i)) continue

    visited.add(i)
    const neighbors = regionQuery(i)

    if (neighbors.length < minSamples) {
      noise.add(i)
    } else {
      const cluster: Entry[] = []
      if (expandCluster(i, neighbors, cluster)) {
        clusters.push(cluster)
      }
    }
  }

  // Convert clusters to Events
  return await Promise.all(clusters.map(cluster => createEventFromCluster(cluster)))
}

// Create Event from cluster of entries
async function createEventFromCluster(entries: Entry[]): Promise<Event> {
  if (entries.length === 0) throw new Error('Empty cluster')

  entries.sort((a, b) => a.timestamp - b.timestamp)

  const startTime = entries[0].timestamp
  const endTime = entries[entries.length - 1].timestamp
  const duration = endTime - startTime

  // Determine event type
  const type = classifyEventType(entries)

  // Hero image: middle screenshot or first one
  const heroIndex = Math.floor(entries.length / 2)
  const heroImage = `/static/${entries[heroIndex].timestamp}.webp`

  // Thumbnails: key moments (start, middle, end, plus any app changes)
  const thumbnails = new Set<string>()
  thumbnails.add(`/static/${entries[0].timestamp}.webp`)
  if (entries.length > 1) {
    thumbnails.add(`/static/${entries[entries.length - 1].timestamp}.webp`)
  }
  if (entries.length > 2) {
    thumbnails.add(heroImage)
  }

  // Apps and stats
  const apps = [...new Set(entries.map(e => e.app))]
  const wordCount = entries.reduce((sum, e) => sum + e.text.split(' ').length, 0)

  // Generate title and description with AI
  const combinedText = entries.map(e => `${e.app}: ${e.title} - ${e.text}`).join('\n')
  const title = await generateEventTitle(combinedText, type)
  const description = await ollamaClient.generateSummary(combinedText)

  // Tags (simple keyword extraction)
  const tags = extractTags(entries)

  return {
    id: generateId(),
    type,
    title,
    description,
    startTime,
    endTime,
    duration,
    entries,
    heroImage,
    thumbnails: Array.from(thumbnails),
    apps,
    stats: {
      screenshotCount: entries.length,
      topApps: getTopApps(entries),
      wordCount,
      topWords: getTopWords(entries),
      // Type-specific stats will be added by classifyEventType
    },
    tags,
  }
}

// Classify event type based on heuristics
function classifyEventType(entries: Entry[]): EventType {
  const apps = entries.map(e => e.app.toLowerCase())
  const titles = entries.map(e => e.title.toLowerCase())


  // Coding indicators
  if (apps.some(app => app.includes('code') || app.includes('vscode') || app.includes('cursor'))) {
    return 'coding'
  }

  // Gaming indicators
  if (apps.some(app => app.includes('game') || titles.some(t => t.includes('game')))) {
    return 'gaming'
  }

  // Video watching
  if (apps.some(app => app.includes('youtube') || app.includes('netflix') || app.includes('vlc'))) {
    return 'video'
  }

  // Meeting indicators
  if (titles.some(t => t.includes('meeting') || t.includes('zoom') || t.includes('teams'))) {
    return 'meeting'
  }

  // Browsing (default)
  return 'browsing'
}

// Generate event title
async function generateEventTitle(_text: string, type: EventType): Promise<string> {
  const typeLabels = {
    coding: 'Coding Session',
    gaming: 'Gaming Session',
    video: 'Video Watching',
    meeting: 'Meeting',
    browsing: 'Web Browsing',
    other: 'Activity'
  }

  return typeLabels[type]
}

// Extract tags from entries
function extractTags(entries: Entry[]): string[] {
  const tags = new Set<string>()

  entries.forEach(entry => {
    // App-based tags
    tags.add(entry.app)

    // Language tags
    if (entry.language !== 'unknown') {
      tags.add(entry.language)
    }

    // Content-based tags (simple keyword extraction)
    const words = entry.text.toLowerCase().split(/\s+/)
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']
    words.forEach(word => {
      if (word.length > 3 && !commonWords.includes(word)) {
        tags.add(word)
      }
    })
  })

  return Array.from(tags).slice(0, 10) // Limit to 10 tags
}

// Helper functions for stats
function getTopApps(entries: Entry[]): Array<[string, number]> {
  const appCounts: Record<string, number> = {}
  entries.forEach(e => {
    appCounts[e.app] = (appCounts[e.app] || 0) + 1
  })
  return Object.entries(appCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
}

function getTopWords(entries: Entry[]): Array<[string, number]> {
  const wordCounts: Record<string, number> = {}
  const commonWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being'])

  entries.forEach(entry => {
    entry.text.toLowerCase().split(/\s+/).forEach(word => {
      if (word.length > 2 && !commonWords.has(word)) {
        wordCounts[word] = (wordCounts[word] || 0) + 1
      }
    })
  })

  return Object.entries(wordCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
}
