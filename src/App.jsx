import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { StoreProvider, useStore } from './hooks/useStore'
import { sbLoadConfig, sbLoadSlots, parseSlotRow } from './lib/supabase'

import Nav from './components/layout/Nav'
import SpiderWeb from './components/layout/SpiderWeb'
import Toast from './components/layout/Toast'
import PasswordOverlay from './components/modals/PasswordOverlay'
import AdminModal from './components/modals/AdminModal'
import VideoViewer from './components/works/VideoViewer'

import WorksPage from './pages/WorksPage'
import PostersPage from './pages/PostersPage'

function AppInner() {
  const { state, dispatch } = useStore()
  const { activeModal, loading } = state

  // Load data from Supabase on mount
  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => {
      if (!cancelled) dispatch({ type: 'SET_LOADING', payload: false })
    }, 8000)

    async function load() {
      try {
        const [cfg, rows] = await Promise.all([sbLoadConfig(), sbLoadSlots()])
        if (cancelled) return

        let slotCount = 6
        let pass = 'stg2025'

        if (cfg) {
          if (cfg.slotCount) slotCount = cfg.slotCount
          if (cfg.pass) pass = cfg.pass
        }

        const slots = {}
        for (let i = 1; i <= slotCount; i++) {
          slots[i] = {
            url: null, embedUrl: null, platform: 'unknown', previewUrl: null,
            link: '', name: 'Project Name', client: 'Client',
            credits: [], trimStart: 0, trimEnd: null, frames: [], frameTypes: {},
          }
        }
        rows.forEach(row => {
          const n = row.slot_n
          if (!n) return
          if (n > slotCount) slotCount = n
          slots[n] = parseSlotRow(row)
        })

        dispatch({ type: 'INIT_SLOTS', payload: { slotCount, slots } })
        dispatch({ type: 'SET_PASS', payload: pass })
      } catch (e) {
        console.error('Load error:', e)
      } finally {
        clearTimeout(timer)
        if (!cancelled) dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    load()
    return () => { cancelled = true; clearTimeout(timer) }
  }, [])

  return (
    <div className="app">
      <div className="grain" />
      <SpiderWeb />

      {/* Loading screen */}
     {loading && (
  <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center gap-4">
    <div className="text-[1.4rem] font-bold tracking-[.12em] uppercase text-gradient-logo">
      STG Studio
    </div>
    <div className="text-[0.52rem] tracking-[.28em] uppercase text-cream/28">
      Loading...
    </div>
  </div>
)}

      {/* Password overlay */}
      {activeModal === 'password' && <PasswordOverlay />}

      {/* Nav — always visible */}
      {!loading && <Nav />}

      {/* Routes */}
      {!loading && (
        <Routes>
          <Route path="/" element={<WorksPage />} />
          <Route path="/posters" element={<PostersPage />} />
        </Routes>
      )}

      {/* Modals */}
      {activeModal && activeModal !== 'password' && <AdminModal />}
      <VideoViewer />

      {/* Toast */}
      <Toast />
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </StoreProvider>
  )
}

