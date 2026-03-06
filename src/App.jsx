// ── App.jsx ──────────────────────────────────────────────────────────────
import { useEffect } from 'react'
import { StoreProvider, useStore } from './hooks/useStore'
import { sbLoadConfig, sbLoadSlots, parseSlotRow } from './lib/supabase'
import Nav from './components/Nav'
import WorksPage from "./pages/WorksPage"
import PostersPage from "./pages/PostersPage"
import AdminModal from './components/AdminModal'
import PasswordOverlay from './components/PasswordOverlay'
import SpiderWeb from './components/SpiderWeb'
import Toast from './components/Toast'

function AppInner() {
  const { state, dispatch } = useStore()
  const { page, activeModal, loading } = state

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
            url: null, link: '', name: 'Project Name', client: 'Client',
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
      {/* Background */}
      <div className="grain" />
      <SpiderWeb />

      {/* Loading screen */}
      {loading && (
        <div id="loading-screen" className="show">
          <div className="ls-logo">STG Studio</div>
          <div className="ls-sub">Loading...</div>
        </div>
      )}

      {/* Password overlay — shown when accessing admin */}
      {activeModal === 'password' && <PasswordOverlay />}

      {/* Nav — always visible */}
      {!loading && <Nav />}

      {/* Pages */}
      {!loading && (
        <>
          <div style={{ display: page === 'works' ? 'block' : 'none' }}>
            < WorksPage/>
          </div>
          <div style={{ display: page === 'posters' ? 'block' : 'none' }}>
            <PostersPage />
          </div>
        </>
      )}

      {/* Admin modal (trim/credits editor) */}
      {activeModal && activeModal !== 'password' && <AdminModal />}

      {/* Toast */}
      <Toast />
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <AppInner />
    </StoreProvider>
  )
}
