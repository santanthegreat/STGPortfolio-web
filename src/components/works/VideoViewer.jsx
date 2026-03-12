import { useEffect } from 'react'
import { useStore } from '../../hooks/useStore'
import { toEmbedUrl } from '../../lib/supabase'

export default function VideoViewer() {
  const { state, dispatch } = useStore()
  const { viewerSlot, slots } = state
  const slot = viewerSlot ? slots[viewerSlot] : null

  useEffect(() => {
    if (!viewerSlot) return
    const onKey = (e) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [viewerSlot])

  useEffect(() => {
    document.body.style.overflow = viewerSlot ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [viewerSlot])

  if (!viewerSlot || !slot) return null

  function close() { dispatch({ type: 'SET_VIEWER', payload: null }) }

  const embedUrl = slot.embedUrl || toEmbedUrl(slot.url)

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/96 flex flex-col items-center justify-center animate-fadeIn"
      onClick={close}
    >
      {/* Close button */}
      <button
        onClick={close}
        className="absolute top-5 right-5 bg-transparent border-none
          text-cream/50 text-2xl cursor-pointer z-10 leading-none
          hover:text-cream transition-colors"
      >
        ✕
      </button>

      {/* Video */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[90vw] max-w-[1100px] aspect-video rounded-lg overflow-hidden
          shadow-[0_24px_80px_rgba(0,0,0,.8)]"
      >
        {embedUrl ? (
          <iframe
            src={embedUrl}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            frameBorder="0"
            className="w-full h-full border-none block"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#0a0a0a] text-cream/30 text-sm">
            No video available
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-5 text-center flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
        <span className="text-base font-bold text-cream tracking-[.04em]">{slot.name}</span>
        <span className="text-[0.6rem] tracking-[.18em] uppercase text-cream/35">{slot.client}</span>

        {slot.credits?.length > 0 && (
          <div className="mt-2.5 flex flex-wrap justify-center gap-x-5 gap-y-1.5">
            {slot.credits.map((c, i) => (
              <span key={i} className="text-[0.55rem] tracking-[.12em] uppercase text-cream/40">
                <span className="text-cream/20">{c.role} </span>{c.name}
              </span>
            ))}
          </div>
        )}

        {slot.link && (
          <a
            href={slot.link}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-2 text-[0.55rem] tracking-[.15em] uppercase text-cream/45 no-underline"
          >
            ↗ Watch Full
          </a>
        )}
      </div>
    </div>
  )
}










