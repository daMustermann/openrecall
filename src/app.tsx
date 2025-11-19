import { Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import Timeline from '@/routes/timeline'
import Dashboard from '@/routes/dashboard'
import EventDetail from '@/routes/event-detail'
import Omnibar from '@/features/search/Omnibar'
import { useEffect } from 'react'

function App() {
  useEffect(() => {
    // Ensure dark mode is always active
    document.documentElement.classList.add('dark')
  }, [])

  return (
    <div className="min-h-screen bg-bg text-white">
      <Omnibar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Timeline />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/event/:eventId" element={<EventDetail />} />
        </Routes>
      </main>
      <Toaster />
    </div>
  )
}

export default App
