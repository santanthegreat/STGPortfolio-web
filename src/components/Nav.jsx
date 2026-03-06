// ── components/Nav.jsx ──────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useStore } from '../hooks/useStore'
import { sbSave, buildSlotRow, sbSaveConfig } from '../lib/supabase'

export default function Nav() {
  const { state, dispatch, showToast } = useStore()
  const { isAdmin, page, slots, slotCount, pass } = state
  const [menuOpen, setMenuOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close panels when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('#menuBtn')) setMenuOpen(false)
      if (!e.target.closest('#infoBtn')) setInfoOpen(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  async function handleSave() {
    setSaving(true)
    const saves = []
    for (let i = 1; i <= slotCount; i++) {
      if (slots[i]) saves.push(sbSave(buildSlotRow(i, slots[i])))
    }
    saves.push(sbSaveConfig({ slotCount, pass }))
    await Promise.all(saves)
    showToast('Saved ✓')
    setSaving(false)
  }

  function handleLogout() {
    dispatch({ type: 'SET_ADMIN', payload: false })
    setMenuOpen(false)
  }

  return (
    <nav className={scrolled ? 'scrolled' : ''}>
      {/* LEFT — Menu */}
      <div className="nav-left" id="menuBtn" onClick={() => setMenuOpen(o => !o)}>
        <div className="nav-dots">
          <span /><span /><span />
        </div>
        <span className="nav-label">Menu</span>
        {isAdmin && <span className="admin-badge show">Admin</span>}

        <div className={`panel${menuOpen ? ' open' : ''}`} id="menuPanel">
          <div className="mp-now">
            Currently viewing — {page === 'works' ? 'Works' : 'Project Posters'}
          </div>
          <ul className="mp-links">
            <li>
              <a
                className={page === 'works' ? 'cur' : ''}
                onClick={() => { dispatch({ type: 'SET_PAGE', payload: 'works' }); setMenuOpen(false) }}
              >All Works</a>
            </li>
            <li>
              <a
                className={page === 'posters' ? 'cur' : ''}
                onClick={() => { dispatch({ type: 'SET_PAGE', payload: 'posters' }); setMenuOpen(false) }}
              >Project Posters</a>
            </li>
            {!isAdmin && (
              <li>
                <a
                  className="adm"
                  onClick={() => { dispatch({ type: 'SET_ACTIVE_MODAL', payload: 'password' }); setMenuOpen(false) }}
                >⚙ Admin</a>
              </li>
            )}
            {isAdmin && (
              <li>
                <a className="logout-lnk" onClick={handleLogout}>✕ Logout</a>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* CENTER — Logo */}
      <span
        className="nav-logo"
        onClick={() => dispatch({ type: 'SET_PAGE', payload: 'works' })}
      >
        STG Studio
      </span>

      {/* SAVE button — admin only */}
      {isAdmin && (
        <button
          className="save-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '● SAVING...' : '● SAVE'}
        </button>
      )}

      {/* RIGHT — Info */}
      <div className="nav-right" id="infoBtn" onClick={() => setInfoOpen(o => !o)}>
        <span className="nav-info-dot" />
        <span className="nav-label">Info</span>

        <div className={`panel${infoOpen ? ' open' : ''}`} id="infoPanel">
          <div className="ip-grid">
            <div>
              <div className="ip-head">Who We Are</div>
              <div className="ip-body">
                STG Studio is a creative video production company based in Lagos, Nigeria.
                We craft visual stories that move audiences.
              </div>
            </div>
            <div>
              <div className="ip-head">Contact</div>
              <div className="ip-lbl">Email</div>
              <a className="ip-val" href="mailto:ebikhumisamuel@gmail.com">ebikhumisamuel@gmail.com</a>
              <div className="ip-lbl">Phone</div>
              <a className="ip-val" href="tel:+2348115061690">+234 811 506 1690</a>
              <div className="ip-lbl">Instagram</div>
              <a className="ip-val" href="https://instagram.com/santanthegreat" target="_blank" rel="noreferrer">@santanthegreat</a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
