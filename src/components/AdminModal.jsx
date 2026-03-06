// ── components/AdminModal.jsx ────────────────────────────────────────────
import { useState, useRef, useEffect } from 'react'
import { useStore } from '../hooks/useStore'
import { sbSave, buildSlotRow, sbUpload } from '../lib/supabase'

export default function AdminModal() {
  const { state, dispatch, showToast } = useStore()
  const { activeModal, slots, isAdmin } = state
  const n = activeModal
  const slot = n ? slots[n] : null

  const [name, setName] = useState('')
  const [client, setClient] = useState('')
  const [link, setLink] = useState('')
  const [credits, setCredits] = useState([])
  const [credOpen, setCredOpen] = useState(false)
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(null)
  const vidRef = useRef(null)
  const tlRef = useRef(null)

  useEffect(() => {
    if (!slot) return
    setName(slot.name || '')
    setClient(slot.client || '')
    setLink(slot.link || '')
    setCredits(slot.credits || [])
    setTrimStart(slot.trimStart || 0)
    setTrimEnd(slot.trimEnd || null)
  }, [n])

  useEffect(() => {
    const vid = vidRef.current
    if (!vid || !slot?.url) return
    vid.src = slot.url
    vid.muted = true
    vid.load()
  }, [slot?.url, n])

  if (!n || !slot || activeModal === 'password') return null

  function close() { dispatch({ type: 'SET_ACTIVE_MODAL', payload: null }) }

  async function save() {
    const updated = { ...slot, name, client, link, credits, trimStart, trimEnd }
    dispatch({ type: 'UPDATE_SLOT', payload: { n, data: updated } })
    await sbSave(buildSlotRow(n, updated))
    showToast('Saved ✓')
    close()
  }

  function addCredit() { setCredits([...credits, { role: '', name: '' }]) }
  function updateCredit(i, field, val) {
    setCredits(credits.map((c, idx) => idx === i ? { ...c, [field]: val } : c))
  }
  function removeCredit(i) { setCredits(credits.filter((_, idx) => idx !== i)) }

  const dur = vidRef.current?.duration || 0
  const startPct = dur ? (trimStart / dur) * 100 : 0
  const endPct = dur ? ((trimEnd || dur) / dur) * 100 : 100

  return (
    <div id="vid-modal" className="open">
      <div className="vm-backdrop" onClick={close} />
      <div className="vm-sheet">
        <div className="vm-pill" onClick={close} />
        <div className="vm-inner">
          <button className="vm-back" onClick={close}>
            <svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
            Back
          </button>

          {/* Video player */}
          <div className="vm-player">
            <video ref={vidRef} loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div className="vm-controls">
              {/* Timeline */}
              <div className="vm-timeline" ref={tlRef}>
                <div className="vm-range-bg" />
                <div className="vm-trim-fill" style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }} />
                <div className="vm-handle" id="th-start" style={{ left: `${startPct}%` }} />
                <div className="vm-handle" id="th-end" style={{ left: `${endPct}%` }} />
              </div>
              <div className="vm-trim-labels">
                <span className="vm-trim-lbl">In: {trimStart.toFixed(1)}s</span>
                <span className="vm-trim-lbl">Out: {(trimEnd || dur).toFixed(1)}s</span>
              </div>
              <div className="vm-ctrl-row">
                <div className="vm-ctrl-left">
                  <button className="vm-play-btn" onClick={() => {
                    const v = vidRef.current
                    if (v.paused) v.play().catch(() => {}); else v.pause()
                  }}>
                    <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </button>
                </div>
                <div className="vm-ctrl-right">
                  <button className="vm-ctrl-btn" onClick={() => { setTrimStart(0); setTrimEnd(null) }}>Reset Trim</button>
                  <button className="vm-ctrl-btn acc" onClick={save}>Save</button>
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="vm-details">
            <div className="vm-title">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Project Name"
                style={{ background: 'none', border: 'none', color: '#f0ede6', font: 'inherit', fontSize: 'clamp(1.2rem,4vw,2rem)', fontWeight: 700, width: '100%', outline: 'none' }}
              />
            </div>
            <div className="vm-client-tag">
              <input
                value={client}
                onChange={e => setClient(e.target.value)}
                placeholder="Client"
                style={{ background: 'none', border: 'none', color: 'rgba(240,237,230,.35)', font: 'inherit', fontSize: '.62rem', letterSpacing: '.2em', textTransform: 'uppercase', width: '100%', outline: 'none' }}
              />
            </div>

            {/* Watch link */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: '.52rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(240,237,230,.38)', marginBottom: 6 }}>
                Watch Link (YouTube / Instagram / Drive)
              </div>
              <input
                value={link}
                onChange={e => setLink(e.target.value)}
                placeholder="https://..."
                type="url"
                className="vm-in"
                style={{ width: '100%' }}
              />
            </div>

            {/* Credits */}
            <button className="vm-edit-btn" onClick={() => setCredOpen(o => !o)}>
              {credOpen ? 'Hide Credits' : 'Edit Credits'}
            </button>

            {credOpen && (
              <div className="vm-ced show">
                {credits.map((c, i) => (
                  <div key={i} className="vm-cf">
                    <input className="vm-cf" placeholder="Role" value={c.role} onChange={e => updateCredit(i, 'role', e.target.value)} style={{ flex: 1 }} />
                    <input className="vm-cf" placeholder="Name" value={c.name} onChange={e => updateCredit(i, 'name', e.target.value)} style={{ flex: 1 }} />
                    <button className="vm-cf-del" onClick={() => removeCredit(i)}>✕</button>
                  </div>
                ))}
                <button className="vm-cadd" onClick={addCredit}>+ Add Credit</button>
                <button className="vm-save-credits" onClick={save}>Save Credits</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
