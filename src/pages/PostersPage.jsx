// ── components/PostersPage.jsx ───────────────────────────────────────────
import { useEffect, useRef, useState } from 'react'
import { useStore } from '../hooks/useStore'

export default function PostersPage() {
  const { state } = useStore()
  const { isAdmin } = state
  const canvasRef = useRef(null)
  const fileRef = useRef(null)
  const [zoom, setZoom] = useState(0.1)
  const [showZoom, setShowZoom] = useState(false)

  // Pan/zoom state (refs so event handlers always have fresh values)
  const panRef = useRef({ x: 0, y: 0 })
  const zoomRef = useRef(0.1)
  const draggingRef = useRef(null)   // { item, startX, startY, origX, origY }
  const isPanningRef = useRef(false)
  const lastPanRef = useRef({ x: 0, y: 0 })
  const itemsRef = useRef([])        // { id, type, x, y, w, h, el }
  const zoomTimerRef = useRef(null)
  const containerRef = useRef(null)

  function applyTransform() {
    const { x, y } = panRef.current
    const z = zoomRef.current
    if (canvasRef.current)
      canvasRef.current.style.transform = `translate(${x}px, ${y}px) scale(${z})`
    setZoom(z)
    setShowZoom(true)
    clearTimeout(zoomTimerRef.current)
    zoomTimerRef.current = setTimeout(() => setShowZoom(false), 1200)
  }

  function clampZoom(z) { return Math.min(3, Math.max(0.05, z)) }

  function addItem(type, src, w, h) {
    const id = Date.now()
    const canvas = canvasRef.current
    if (!canvas) return

    // Place item near center of current viewport
    const vpW = window.innerWidth, vpH = window.innerHeight
    const z = zoomRef.current
    const { x: px, y: py } = panRef.current
    const cx = (-px + vpW / 2) / z
    const cy = (-py + vpH / 2) / z

    const el = document.createElement(type === 'text' ? 'div' : type === 'image' ? 'img' : 'video')
    el.className = 'canvas-item'
    el.style.cssText = `
      position:absolute;
      left:${cx - w/2}px; top:${cy - h/2}px;
      width:${w}px; height:${h}px;
      cursor:grab; user-select:none;
      border-radius:4px; overflow:hidden;
      box-shadow:0 8px 32px rgba(0,0,0,.6);
    `

    if (type === 'image') {
      el.src = src
      el.style.objectFit = 'cover'
      el.draggable = false
    } else if (type === 'video') {
      el.src = src
      el.loop = true; el.muted = true; el.autoplay = true; el.playsInline = true
      el.style.objectFit = 'cover'
    } else {
      el.contentEditable = 'true'
      el.innerText = 'Click to edit text'
      el.style.cssText += `
        padding:16px 20px; min-width:120px; min-height:40px;
        color:#f0ede6; font-family:Archivo,sans-serif;
        font-size:1.2rem; font-weight:700;
        background:rgba(0,0,0,.5); border:1px solid rgba(255,255,255,.15);
        outline:none; cursor:text;
      `
    }

    canvas.appendChild(el)
    const item = { id, type, el, x: cx - w/2, y: cy - h/2, w, h }
    itemsRef.current.push(item)
    wireItem(item)
  }

  function wireItem(item) {
    const { el } = item
    if (item.type === 'text') return // text uses contenteditable directly

    el.addEventListener('pointerdown', (e) => {
      if (!isAdmin) return
      e.stopPropagation()
      el.setPointerCapture(e.pointerId)
      draggingRef.current = {
        item, startX: e.clientX, startY: e.clientY,
        origX: item.x, origY: item.y,
      }
      el.style.cursor = 'grabbing'
    })

    el.addEventListener('pointermove', (e) => {
      const d = draggingRef.current
      if (!d || d.item.id !== item.id) return
      const z = zoomRef.current
      const dx = (e.clientX - d.startX) / z
      const dy = (e.clientY - d.startY) / z
      item.x = d.origX + dx
      item.y = d.origY + dy
      el.style.left = item.x + 'px'
      el.style.top = item.y + 'px'
    })

    el.addEventListener('pointerup', () => {
      draggingRef.current = null
      el.style.cursor = 'grab'
    })
  }

  function handleFileAdd(e) {
    Array.from(e.target.files).forEach(file => {
      const url = URL.createObjectURL(file)
      const isVideo = file.type.startsWith('video')
      const img = new Image()
      if (!isVideo) {
        img.onload = () => {
          const maxW = 600, maxH = 600
          let w = img.naturalWidth, h = img.naturalHeight
          if (w > maxW) { h = h * maxW / w; w = maxW }
          if (h > maxH) { w = w * maxH / h; h = maxH }
          addItem('image', url, Math.round(w), Math.round(h))
        }
        img.src = url
      } else {
        addItem('video', url, 480, 270)
      }
    })
    e.target.value = ''
  }

  // Pan and zoom on the container
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // Wheel zoom
    const onWheel = (e) => {
      e.preventDefault()
      const factor = e.deltaY < 0 ? 1.1 : 0.9
      zoomRef.current = clampZoom(zoomRef.current * factor)
      applyTransform()
    }

    // Panning (pointer on background)
    const onPointerDown = (e) => {
      if (e.target !== el && e.target !== canvasRef.current) return
      isPanningRef.current = true
      lastPanRef.current = { x: e.clientX, y: e.clientY }
      el.style.cursor = 'grabbing'
    }
    const onPointerMove = (e) => {
      if (!isPanningRef.current) return
      panRef.current.x += e.clientX - lastPanRef.current.x
      panRef.current.y += e.clientY - lastPanRef.current.y
      lastPanRef.current = { x: e.clientX, y: e.clientY }
      applyTransform()
    }
    const onPointerUp = () => {
      isPanningRef.current = false
      el.style.cursor = 'grab'
    }

    // Pinch zoom (touch)
    let lastPinchDist = null
    const onTouchMove = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        const dist = Math.sqrt(dx*dx + dy*dy)
        if (lastPinchDist) {
          zoomRef.current = clampZoom(zoomRef.current * dist / lastPinchDist)
          applyTransform()
        }
        lastPinchDist = dist
      }
    }
    const onTouchEnd = () => { lastPinchDist = null }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)

    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  function resetView() {
    panRef.current = { x: 0, y: 0 }
    zoomRef.current = 0.1
    applyTransform()
  }

  return (
    <>
      <div
        ref={containerRef}
        id="pg-posters"
        style={{ display: 'block', cursor: 'grab' }}
      >
        <div
          ref={canvasRef}
          id="canvas"
          style={{ transformOrigin: '0 0', transform: 'translate(0,0) scale(0.1)' }}
        />
      </div>

      {/* Toolbar */}
      {isAdmin && (
        <div className="toolbar show">
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileAdd}
          />
          <button className="tb-btn acc" onClick={() => fileRef.current?.click()}>
            + Image / Clip
          </button>
          <button className="tb-btn" onClick={() => addItem('text', null, 200, 60)}>
            + Text
          </button>
          <div className="tb-sep" />
          <button className="tb-btn" onClick={() => { zoomRef.current = clampZoom(zoomRef.current * 1.25); applyTransform() }}>
            Zoom +
          </button>
          <button className="tb-btn" onClick={() => { zoomRef.current = clampZoom(zoomRef.current * 0.8); applyTransform() }}>
            Zoom −
          </button>
          <button className="tb-btn" onClick={resetView}>
            Reset View
          </button>
          <div className="tb-sep" />
          <span className="tb-hint">Drag to pan · Scroll to zoom</span>
        </div>
      )}

      {/* Zoom badge */}
      <div className="zoom-badge" style={{ display: showZoom ? 'block' : 'none' }}>
        {Math.round(zoom * 100)}%
      </div>
    </>
  )
}

