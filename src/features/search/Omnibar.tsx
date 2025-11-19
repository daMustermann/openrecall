import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search } from 'lucide-react'
import { useUiStore } from '@/state/uiSlice'
import { useEventsStore } from '@/state/eventsSlice'
import { performSearch } from './searchIndex'
import { cn } from '@/lib/utils'

export default function Omnibar() {
  const { omnibar, setOmnibarOpen, setOmnibarQuery } = useUiStore()
  const { events } = useEventsStore()
  const [localQuery, setLocalQuery] = useState('')

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOmnibarOpen(!omnibar.isOpen)
      } else if (e.key === 'Escape' && omnibar.isOpen) {
        setOmnibarOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [omnibar.isOpen, setOmnibarOpen])

  // Update search when query changes
  useEffect(() => {
    if (localQuery.trim()) {
      performSearch(localQuery, events)
      setOmnibarQuery(localQuery) // This will update omnibar.results via search logic
    } else {
      setOmnibarQuery('')
    }
  }, [localQuery, events, setOmnibarQuery])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuery(e.target.value)
  }, [])

  const handleResultClick = useCallback((_result: any) => {
    // Navigate to event or entry
    setOmnibarOpen(false)
    setLocalQuery('')
  }, [setOmnibarOpen])

  if (!omnibar.isOpen) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
      >
        <button
          onClick={() => setOmnibarOpen(true)}
          className="glass px-4 py-2 rounded-lg flex items-center gap-2 text-cyan hover:text-white transition-colors cursor-pointer"
        >
          <Search className="w-4 h-4" />
          <span className="text-sm">Search...</span>
          <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-panel rounded">⌘K</kbd>
        </button>
      </motion.div>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20"
        onClick={() => setOmnibarOpen(false)}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="w-full max-w-2xl mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="glass rounded-xl overflow-hidden shadow-2xl">
            {/* Search Input */}
            <div className="flex items-center px-4 py-3 border-b border-white/10">
              <Search className="w-5 h-5 text-cyan mr-3" />
              <input
                type="text"
                placeholder="Search your digital memory..."
                value={localQuery}
                onChange={handleInputChange}
                className="flex-1 bg-transparent outline-none text-white placeholder-white/50"
                autoFocus
              />
              <kbd className="ml-2 px-2 py-1 text-xs bg-panel rounded">ESC</kbd>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {omnibar.results.length > 0 ? (
                <div className="py-2">
                  {omnibar.results.slice(0, 8).map((result, index) => (
                    <motion.div
                      key={result.entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "px-4 py-3 hover:bg-white/5 cursor-pointer flex items-center gap-3",
                        index === omnibar.selectedIndex && "bg-cyan/10"
                      )}
                      onClick={() => handleResultClick(result)}
                    >
                      <img
                        src={`/static/${result.entry.timestamp}.webp`}
                        alt="Screenshot"
                        className="w-12 h-8 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">
                          {result.entry.app} • {result.entry.title}
                        </div>
                        <div className="text-xs text-white/70 truncate">
                          {result.highlights[0] || result.entry.text.slice(0, 100)}
                        </div>
                      </div>
                      <div className="text-xs text-cyan">
                        {new Date(result.entry.timestamp * 1000).toLocaleDateString()}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : localQuery ? (
                <div className="px-4 py-8 text-center text-white/50">
                  No results found for "{localQuery}"
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-white/50">
                  Start typing to search your digital memory...
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
