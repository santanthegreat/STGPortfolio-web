import { useRef, useEffect, useCallback } from 'react'
import { useStore } from '../../hooks/useStore'
import { sbDeleteSlot, sbClearSlot, sbSave, buildSlotRow, sbSaveConfig } from '../../lib/supabase'
import { DEFAULT_SLOT } from '../../hooks/useStore'

export default function WorkSlot({ n }) {
  const { state, dispatch, showToast } = useStore()
  const { slots, slotCount, isAdmin, pass } = state
  const slot = slots[n]
  const vidRef = useRef(null)

  useEffect(() => {
    const vid = vidRef.current
    if (!vid || !slot.previewUrl) return
    vid.src = slot.previewUrl
    vid.muted = true
    vid.load()
    vid.play().catch(() => {})
  }, [slot.previewUrl])

  const handleClick = useCallback((e) => {
    if (e.target.closest('.no-click')) return
    if (isAdmin) {
      dispatch({ type: 'SET_ACTIVE_MODAL', payload: n })
    } else if (slot.url) {
      dispatch({ type: 'SET_VIEWER', payload: n })
    }
  }, [slot, isAdmin, n, dispatch])

  // Clears video data from slot but keeps the slot itself
  async function handleDeleteVideo(e) {
    e.stopPropagation()
    if (!confirm('Remove the video from this slot? The slot will stay empty.')) return
    dispatch({ type: 'CLEAR_SLOT', payload: n })
    await sbClearSlot(n)
    showToast('Video removed ✓')
  }

  // Removes the slot entirely, re-numbers remaining slots, updates slotCount
  async function handleDeleteSlot(e) {
    e.stopPropagation()
    if (!confirm('Delete this entire slot? It will be removed from the grid.')) return

    // Build the new slots state (same logic as reducer)
    const newSlots = {}
    let count = 0
    for (let i = 1; i <= slotCount; i++) {
      if (i === n) continue
      count++
      newSlots[count] = { ...slots[i] }
    }
    const newCount = slotCount - 1

    dispatch({ type: 'DELETE_SLOT', payload: n })

    // Delete old slot row, re-save all remaining rows with new slot_n numbers, update config
    await sbDeleteSlot(n)
    await Promise.all(
      Object.entries(newSlots).map(([idx, slotData]) =>
        sbSave(buildSlotRow(Number(idx), slotData))
      )
    )
    await sbSaveConfig({ slotCount: newCount, pass })
    showToast('Slot deleted ✓')
  }

  const hasPreview = !!slot.previewUrl
  const hasUrl = !!slot.url

  return (
    <div className="relative bg-black cursor-pointer group" onClick={handleClick}>

      <div className="relative overflow-hidden aspect-square bg-[#0a0a0a] rounded-[4px]">

        {isAdmin && !hasPreview && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2
            bg-white/[0.03] border border-dashed border-white/[0.12] z-[2]">
            <div className="text-[1.6rem] opacity-40 font-light text-cream">+</div>
            <span className="text-[0.56rem] tracking-[.2em] uppercase text-cream/30 font-medium text-center px-4">
              {hasUrl ? 'Add Preview Clip' : 'Add Video'}
            </span>
            {hasUrl && (
              <span className="text-[0.48rem] tracking-[.15em] uppercase text-yellow-300/60 font-medium">
                URL saved — preview missing
              </span>
            )}
          </div>
        )}

        {hasPreview && (
          <video
            ref={vidRef}
            loop muted playsInline
            className="absolute inset-0 w-full h-full object-cover block"
          />
        )}

        {/* Delete Video — only when slot has content */}
        {isAdmin && (hasUrl || hasPreview) && (
          <button
            className="no-click absolute top-2 left-2 z-10
              bg-orange-600/90 text-white
              text-[0.45rem] font-bold tracking-[.12em] uppercase px-2 py-[4px]
              cursor-pointer rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleDeleteVideo}
            title="Clear video, keep slot"
          >
            ✕ Video
          </button>
        )}

        {/* Delete Slot — always visible for admin */}
        {isAdmin && (
          <button
            className="no-click absolute bottom-2 left-2 z-10
              bg-red-700/90 text-white
              text-[0.45rem] font-bold tracking-[.12em] uppercase px-2 py-[4px]
              cursor-pointer rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleDeleteSlot}
            title="Delete entire slot"
          >
            ✕ Slot
          </button>
        )}

        {isAdmin && (hasUrl || hasPreview) && (
          <button
            className="no-click absolute top-2 right-2 z-10
              bg-black/60 backdrop-blur-md border border-yellow-400/45 text-yellow-300
              text-[0.5rem] font-bold tracking-[.14em] uppercase px-2.5 py-[5px]
              cursor-pointer rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => { e.stopPropagation(); dispatch({ type: 'SET_ACTIVE_MODAL', payload: n }) }}
          >
            ✎ Edit
          </button>
        )}
      </div>

      <div className="px-0.5 pt-[7px] pb-[14px] flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="text-[0.78rem] font-bold tracking-[.04em] text-cream truncate block">
          {slot.name}
        </span>
        <span className="text-[0.62rem] tracking-[.14em] uppercase text-cream/40 font-medium block">
          {slot.client}
        </span>
        {slot.link && (
          <a
            className="no-click text-[0.5rem] tracking-[.13em] uppercase text-cream/45 no-underline mt-0.5 block"
            href={slot.link}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            ↗ Watch
          </a>
        )}
      </div>
    </div>
  )
}