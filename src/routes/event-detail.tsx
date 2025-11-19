import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Play, Pause, ZoomIn, ZoomOut, Download } from 'lucide-react'
import { useEventsStore } from '@/state/eventsSlice'
import { useUiStore } from '@/state/uiSlice'
import { formatTimestamp, formatDuration } from '@/lib/utils'

export default function EventDetail() {
  const { eventId } = useParams()
  const { events } = useEventsStore()
  const { playback, setPlaybackPlaying } = useUiStore()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [zoom, setZoom] = useState(1)

  const event = events.find(e => e.id === eventId)

  useEffect(() => {
    if (playback.isPlaying && event) {
      const interval = setInterval(() => {
        setCurrentImageIndex(prev => {
          const next = prev + 1
          if (next >= event.entries.length) {
            setPlaybackPlaying(false)
            return 0
          }
          return next
        })
      }, 2000) // 2 seconds per image

      return () => clearInterval(interval)
    }
  }, [playback.isPlaying, event, setPlaybackPlaying])

  if (!event) {
    return (
      <div className="text-center py-12">
        <div className="text-white/50 mb-4">Event not found</div>
        <Link
          to="/"
          className="glass px-4 py-2 rounded-lg text-cyan hover:text-white transition-colors"
        >
          Back to Timeline
        </Link>
      </div>
    )
  }

  const currentEntry = event.entries[currentImageIndex]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="glass p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-cyan hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Timeline
          </Link>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setPlaybackPlaying(!playback.isPlaying)}
              className="p-2 rounded-lg bg-cyan/20 hover:bg-cyan/30 text-cyan transition-colors"
            >
              {playback.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-white/60 min-w-[3rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Event Info */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{event.title}</h1>
            <p className="text-white/70 mb-4">{event.description}</p>
            <div className="flex items-center gap-4 text-sm text-white/60">
              <span>{formatTimestamp(event.startTime)}</span>
              <span>{formatDuration(event.duration)}</span>
              <span>{event.stats.screenshotCount} screenshots</span>
            </div>
          </div>

          <div className="text-right">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              event.type === 'coding' ? 'bg-cyan/20 text-cyan' :
              event.type === 'gaming' ? 'bg-neon/20 text-neon' :
              event.type === 'video' ? 'bg-orange/20 text-orange' :
              event.type === 'meeting' ? 'bg-magenta/20 text-magenta' :
              'bg-white/10 text-white/70'
            }`}>
              {event.type}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Image Viewer */}
        <div className="lg:col-span-3">
          <motion.div
            className="glass rounded-xl overflow-hidden"
            style={{ height: '70vh' }}
          >
            <div className="relative w-full h-full overflow-hidden">
              <motion.img
                key={currentImageIndex}
                src={`/static/${currentEntry.timestamp}.webp`}
                alt={`Screenshot ${currentImageIndex + 1}`}
                className="w-full h-full object-contain"
                style={{ scale: zoom }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />

              {/* Image Counter */}
              <div className="absolute top-4 left-4 glass px-3 py-1 rounded-lg text-white/80 text-sm">
                {currentImageIndex + 1} / {event.entries.length}
              </div>

              {/* OCR Text Overlay */}
              {currentEntry.text && (
                <div className="absolute bottom-4 left-4 right-4 glass p-4 rounded-lg max-h-32 overflow-y-auto">
                  <div className="text-white/90 text-sm">
                    {currentEntry.text}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Thumbnail Strip */}
          <div className="glass p-4 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-3">Screenshots</h3>
            <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
              {event.entries.map((entry, index) => (
                <button
                  key={entry.id}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative rounded-lg overflow-hidden transition-all ${
                    index === currentImageIndex ? 'ring-2 ring-cyan' : ''
                  }`}
                >
                  <img
                    src={`/static/${entry.timestamp}.webp`}
                    alt={`Thumb ${index + 1}`}
                    className="w-full h-16 object-cover"
                  />
                  {index === currentImageIndex && (
                    <div className="absolute inset-0 bg-cyan/20" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Event Stats */}
          <div className="glass p-4 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-3">Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Apps:</span>
                <span className="text-white">{event.apps.join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Tags:</span>
                <div className="flex flex-wrap gap-1">
                  {event.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-1 bg-white/10 rounded text-xs text-white/80">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
