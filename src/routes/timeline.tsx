import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Calendar, Clock, Play, Pause } from 'lucide-react'
import { useEntries } from '@/api/queries'
import { useEventsStore } from '@/state/eventsSlice'
import { useUiStore } from '@/state/uiSlice'
import { extractFeatures, clusterEntries } from '@/features/clustering/cluster'
import { formatTimestamp, formatDuration } from '@/lib/utils'

export default function Timeline() {
  const { data: entries, isLoading } = useEntries()
  const { events, setEvents } = useEventsStore()
  const { playback, setPlaybackPlaying } = useUiStore()


  // Process entries into events on data load
  useEffect(() => {
    if (entries && entries.length > 0) {
      const processEntries = async () => {
        const featureData = extractFeatures(entries)
        const clusteredEvents = await clusterEntries(featureData)
        setEvents(clusteredEvents)
      }
      processEntries()
    }
  }, [entries, setEvents])

  const handlePlaybackToggle = () => {
    if (playback.isPlaying) {
      setPlaybackPlaying(false)
    } else {
      setPlaybackPlaying(true)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-cyan">Loading your digital memory...</div>
      </div>
    )
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-white/50 mb-4">No events recorded yet</div>
        <div className="text-sm text-white/30">
          Start using your computer and OpenRecall will begin capturing your digital activity.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Timeline</h1>
          <p className="text-white/70">Your digital memory, organized by events</p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="glass px-4 py-2 rounded-lg text-cyan hover:text-white transition-colors"
          >
            View Dashboard
          </Link>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid gap-6">
        {events.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass rounded-xl overflow-hidden hover:shadow-glow transition-all duration-300"
          >
            <div className="p-6">
              {/* Event Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      event.type === 'coding' ? 'bg-cyan/20 text-cyan' :
                      event.type === 'gaming' ? 'bg-neon/20 text-neon' :
                      event.type === 'video' ? 'bg-orange/20 text-orange' :
                      event.type === 'meeting' ? 'bg-magenta/20 text-magenta' :
                      'bg-white/10 text-white/70'
                    }`}>
                      {event.type}
                    </span>
                    <div className="flex items-center gap-1 text-white/50 text-sm">
                      <Clock className="w-4 h-4" />
                      {formatDuration(event.duration)}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-1">
                    {event.title}
                  </h3>
                  <p className="text-white/70 text-sm line-clamp-2">
                    {event.description}
                  </p>
                </div>

                {/* Hero Image */}
                <div className="ml-4 flex-shrink-0">
                  <img
                    src={event.heroImage}
                    alt="Event preview"
                    className="w-24 h-16 rounded-lg object-cover"
                  />
                </div>
              </div>

              {/* Event Stats */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4 text-sm text-white/60">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatTimestamp(event.startTime)}
                  </div>
                  <div>
                    {event.stats.screenshotCount} screenshots
                  </div>
                  <div>
                    {event.apps.join(', ')}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePlaybackToggle}
                    className="p-2 rounded-lg bg-cyan/20 hover:bg-cyan/30 text-cyan transition-colors"
                  >
                    {playback.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <Link
                    to={`/event/${event.id}`}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>

              {/* Thumbnail Strip */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {event.thumbnails.slice(0, 6).map((thumb, i) => (
                  <img
                    key={i}
                    src={thumb}
                    alt={`Thumbnail ${i + 1}`}
                    className="w-16 h-12 rounded object-cover flex-shrink-0"
                  />
                ))}
                {event.thumbnails.length > 6 && (
                  <div className="w-16 h-12 rounded bg-white/10 flex items-center justify-center text-white/50 text-xs flex-shrink-0">
                    +{event.thumbnails.length - 6}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
