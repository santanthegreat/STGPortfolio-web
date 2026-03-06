// ── components/WorkSlot.jsx ──────────────────────────────────────────────
import { useRef, useEffect, useCallback } from 'react'
import { useStore } from '../hooks/useStore'
import { sbUpload, sbSave, buildSlotRow, sbDeleteSlot } from '../lib/supabase'

const isTouchDevice = 'ontouchstart' in window

export default function WorkSlot({ n }) {
  const { state, dispatch, showToast } = useStore()
  const { slots, isAdmin } = state
  const slot = slots[n]
  const vidRef = useRef(null)
  const fileRef = useRef(null)
  const loopRef = useRef(null)

  // Setup loop trim
  useEffect(() => {
    const vid = vidRef.current
    if (!vid || !slot.url) return
    vid.src = slot.url
    vid.muted = true
    vid.load()
    vid.play().catch(() => {})
  }, [slot.url])

  useEffect(() => {
    const vid = vidRef.current
    if (!vid) return
    const onTime = () => {
      const end = slot.trimEnd || vid.duration
      if (end && vid.currentTime >= end) vid.currentTime = slot.trimStart || 0
    }
    vid.addEventListener('timeupdate', onTime)
    return () => vid.removeEventListener('timeupdate', onTime)
  }, [slot.trimStart, slot.trimEnd])

  const handleClick = useCallback((e) => {
    if (e.target.closest('.trim-btn, .del-slot-btn, .work-ph, .w-ext-link')) return
    if (!slot.url && !isAdmin) return

    if (isAdmin && slot.url) {
      dispatch({ type: 'SET_ACTIVE_MODAL', payload: n })
    } else if (!isAdmin && slot.link) {
      window.open(slot.link, '_blank')
    }
  }, [slot, isAdmin, n, dispatch])

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const mb = file.size / 1024 / 1024
    if (mb > 45) {
      showToast(`Too large (${mb.toFixed(0)}MB) — compress with HandBrake to under 45MB first.`, true)
      return
    }
    // Play locally immediately
    const localUrl = URL.createObjectURL(file)
    dispatch({ type: 'UPDATE_SLOT', payload: { n, data: { url: localUrl, trimStart: 0, trimEnd: null } } })

    // Upload to Supabase in background
    const path = `slot_${n}_${Date.now()}.mp4`
    sbUpload(path, file,
      (pct) => showToast(`Uploading... ${pct}%`),
      async (url) => {
        dispatch({ type: 'UPDATE_SLOT', payload: { n, data: { url } } })
        showToast('Upload complete ✓')
        await sbSave(buildSlotRow(n, { ...slot, url }))
      },
      (err) => showToast(`Upload failed: ${err}`, true)
    )
  }

  async function handleDelete() {
    if (!confirm('Delete this slot?')) return
    dispatch({ type: 'DELETE_SLOT', payload: n })
    await sbDeleteSlot(n)
  }

  const hasVideo = !!slot.url
  const isTouch = isTouchDevice

  return (
    <div className="work-item" onClick={handleClick}>
      {/* Video box */}
      <div className="work-video-box">
        {/* Placeholder */}
        {isAdmin && (
          <div
            className="work-ph"
            style={{ display: hasVideo ? 'none' : 'flex' }}
            onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}
          >
            <div className="ph-plus">+</div>
            <span className="ph-lbl">Upload Video</span>
          </div>
        )}

        {/* Video */}
        <video
          ref={vidRef}
          className="work-vid"
          loop
          muted
          playsInline
          style={{ display: hasVideo ? 'block' : 'none' }}
        />

        {/* Admin controls */}
        {isAdmin && hasVideo && (
          <>
            <button
              className="trim-btn show"
              onClick={(e) => { e.stopPropagation(); dispatch({ type: 'SET_ACTIVE_MODAL', payload: n }) }}
            >
              ✂ Edit
            </button>
            <button
              className="del-slot-btn show"
              onClick={(e) => { e.stopPropagation(); handleDelete() }}
            >
              ✕
            </button>
          </>
        )}
      </div>

      {/* Labels */}
      <div className="work-labels">
        <span className="w-name">{slot.name}</span>
        <span className="w-client">{slot.client}</span>
        {slot.link && (
          <a
            className="w-ext-link"
            href={slot.link}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            ↗ Watch
          </a>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  )
}
