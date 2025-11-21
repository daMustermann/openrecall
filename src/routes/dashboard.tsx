
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { BarChart3, Clock, Code, Gamepad2, Monitor, TrendingUp } from 'lucide-react'
import { useEventsStore } from '@/state/eventsSlice'
import { calculateProductivityScore, formatDuration } from '@/lib/utils'

export default function Dashboard() {
  const { events } = useEventsStore()

  // Calculate stats
  const totalScreenshots = events.reduce((sum, e) => sum + e.stats.screenshotCount, 0)
  const totalEvents = events.length
  const avgProductivity = events.length > 0 ?
    events.reduce((sum, e) => sum + calculateProductivityScore(e.entries), 0) / events.length : 0

  // Event type distribution
  const eventTypes = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Top apps
  const appUsage = events.reduce((acc, event) => {
    event.apps.forEach(app => {
      acc[app] = (acc[app] || 0) + event.duration
    })
    return acc
  }, {} as Record<string, number>)

  const topApps = Object.entries(appUsage)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Daily Recall</h1>
          <p className="text-white/70">Insights into your digital activity</p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="glass px-4 py-2 rounded-lg text-cyan hover:text-white transition-colors"
          >
            Back to Timeline
          </Link>
          <Link
            to="/settings"
            className="glass px-4 py-2 rounded-lg text-cyan hover:text-white transition-colors"
          >
            Settings
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-6 rounded-xl"
        >
          <div className="flex items-center gap-3 mb-2">
            <Monitor className="w-8 h-8 text-cyan" />
            <div>
              <div className="text-2xl font-bold text-white">{totalScreenshots}</div>
              <div className="text-white/60 text-sm">Screenshots</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass p-6 rounded-xl"
        >
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8 text-neon" />
            <div>
              <div className="text-2xl font-bold text-white">{totalEvents}</div>
              <div className="text-white/60 text-sm">Events</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass p-6 rounded-xl"
        >
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-orange" />
            <div>
              <div className="text-2xl font-bold text-white">{Math.round(avgProductivity)}%</div>
              <div className="text-white/60 text-sm">Productivity</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass p-6 rounded-xl"
        >
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-8 h-8 text-magenta" />
            <div>
              <div className="text-2xl font-bold text-white">
                {formatDuration(events.reduce((sum, e) => sum + e.duration, 0))}
              </div>
              <div className="text-white/60 text-sm">Total Time</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Activity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Types */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass p-6 rounded-xl"
        >
          <h3 className="text-xl font-semibold text-white mb-4">Activity Types</h3>
          <div className="space-y-3">
            {Object.entries(eventTypes).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {type === 'coding' && <Code className="w-4 h-4 text-cyan" />}
                  {type === 'gaming' && <Gamepad2 className="w-4 h-4 text-neon" />}
                  {type === 'browsing' && <Monitor className="w-4 h-4 text-orange" />}
                  <span className="text-white capitalize">{type}</span>
                </div>
                <span className="text-white/60">{count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top Apps */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass p-6 rounded-xl"
        >
          <h3 className="text-xl font-semibold text-white mb-4">Most Used Apps</h3>
          <div className="space-y-3">
            {topApps.map(([app, duration]) => (
              <div key={app} className="flex items-center justify-between">
                <span className="text-white">{app}</span>
                <span className="text-white/60">{formatDuration(duration)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Activity Heatmap Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 rounded-xl"
      >
        <h3 className="text-xl font-semibold text-white mb-4">Activity Heatmap</h3>
        <div className="text-white/60 text-center py-8">
          Activity heatmap visualization would go here
        </div>
      </motion.div>
    </div>
  )
}
