// ── components/SpiderWeb.jsx ─────────────────────────────────────────────
import { useEffect, useRef } from 'react'

export default function SpiderWeb() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animId, nodes = [], edges = [], frameCount = 0
    let spider = { x: 0, y: 0, tx: 0, ty: 0, legPhase: 0, trail: [], targetNode: 0 }
    let mouseX = -1, mouseY = -1

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initNodes()
    }

    function initNodes() {
      const W = canvas.width, H = canvas.height
      const count = Math.max(22, Math.min(60, Math.floor(W * H / 18000)))
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.24, vy: (Math.random() - 0.5) * 0.24,
        r: 1.4,
      }))
      buildEdges()
      spider.x = W / 2; spider.y = H / 2
      spider.tx = W / 2; spider.ty = H / 2
    }

    function buildEdges() {
      edges = []
      const maxDist = Math.min(canvas.width, canvas.height) * 0.35
      nodes.forEach((a, i) => {
        let conns = 0
        nodes.forEach((b, j) => {
          if (i >= j || conns >= 3) return
          const dx = a.x - b.x, dy = a.y - b.y
          if (Math.sqrt(dx * dx + dy * dy) < maxDist) { edges.push([i, j]); conns++ }
        })
      })
    }

    function getRandomNodePos() {
      const node = nodes[Math.floor(Math.random() * nodes.length)]
      return { x: node.x + (Math.random() - 0.5) * 160, y: node.y + (Math.random() - 0.5) * 160 }
    }

    function drawSpider(x, y, phase) {
      ctx.save()
      ctx.translate(x, y)
      const shadow = 4
      ctx.shadowColor = 'rgba(0,0,0,0.5)'
      ctx.shadowBlur = shadow

      // Abdomen
      ctx.beginPath()
      ctx.ellipse(0, 5, 7, 9, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#111'
      ctx.fill()

      // Hourglass
      ctx.beginPath()
      ctx.ellipse(0, 5, 2.5, 4, 0, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(80,0,0,0.6)'
      ctx.fill()

      // Cephalothorax
      ctx.beginPath()
      ctx.ellipse(0, -4, 5, 6, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#1a1a1a'
      ctx.fill()

      // Eyes
      const eyePairs = [[-2, -7], [2, -7], [-3.5, -5.5], [3.5, -5.5]]
      eyePairs.forEach(([ex, ey]) => {
        ctx.beginPath()
        ctx.arc(ex, ey, 0.8, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(180,220,180,0.9)'
        ctx.fill()
      })

      // Legs
      ctx.strokeStyle = '#222'
      ctx.lineWidth = 1
      ctx.shadowBlur = 0
      const legConfigs = [
        [-5, -2, -18, -12, -28, -6], [5, -2, 18, -12, 28, -6],
        [-5, 0, -20, -4, -32, 2], [5, 0, 20, -4, 32, 2],
        [-5, 2, -20, 8, -30, 16], [5, 2, 20, 8, 30, 16],
        [-4, 4, -16, 16, -22, 26], [4, 4, 16, 16, 22, 26],
      ]
      legConfigs.forEach(([x1, y1, x2, y2, x3, y3], i) => {
        const wave = Math.sin(phase + i * 0.8) * 3
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.quadraticCurveTo(x2 + wave, y2 + wave, x3, y3)
        ctx.stroke()
      })

      // Spinnerets
      ctx.beginPath()
      ctx.ellipse(0, 14, 2, 3, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#111'
      ctx.fill()

      ctx.restore()
    }

    function draw() {
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)
      frameCount++

      // Rebuild edges periodically
      if (frameCount % 300 === 0) buildEdges()

      // Move nodes
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy
        if (n.x < 0 || n.x > W) n.vx *= -1
        if (n.y < 0 || n.y > H) n.vy *= -1
      })

      // Draw strands
      ctx.strokeStyle = 'rgba(220,220,210,0.55)'
      ctx.lineWidth = 0.8
      ctx.globalAlpha = 0.5
      edges.forEach(([i, j]) => {
        const a = nodes[i], b = nodes[j]
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 + 8
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.quadraticCurveTo(mx, my, b.x, b.y)
        ctx.stroke()
      })

      // Draw nodes
      ctx.globalAlpha = 0.6
      ctx.fillStyle = 'rgba(220,220,210,0.6)'
      nodes.forEach(n => {
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fill()
      })

      // Spider trail
      if (spider.trail.length > 1) {
        ctx.globalAlpha = 0.25
        ctx.strokeStyle = 'rgba(220,220,210,0.25)'
        ctx.lineWidth = 0.6
        ctx.beginPath()
        ctx.moveTo(spider.trail[0].x, spider.trail[0].y)
        spider.trail.forEach(p => ctx.lineTo(p.x, p.y))
        ctx.stroke()
      }

      ctx.globalAlpha = 1

      // Move spider toward target
      const dx = spider.tx - spider.x, dy = spider.ty - spider.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > 1) {
        const speed = Math.min(1.2, dist * 0.04)
        spider.x += (dx / dist) * speed
        spider.y += (dy / dist) * speed
        spider.legPhase += 0.15
        spider.trail.push({ x: spider.x, y: spider.y })
        if (spider.trail.length > 60) spider.trail.shift()
      } else {
        // Pick new target after pause
        if (!spider._pause) {
          spider._pause = setTimeout(() => {
            const pos = getRandomNodePos()
            spider.tx = Math.max(0, Math.min(W, pos.x))
            spider.ty = Math.max(0, Math.min(H, pos.y))
            spider._pause = null
          }, 3000 + Math.random() * 2000)
        }
      }

      drawSpider(spider.x, spider.y, spider.legPhase)
      animId = requestAnimationFrame(draw)
    }

    const onMouse = (e) => {
      mouseX = e.clientX; mouseY = e.clientY
      if (Math.random() < 0.008) { spider.tx = mouseX; spider.ty = mouseY }
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMouse)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouse)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      id="web-canvas"
      style={{
        position: 'fixed', inset: 0, zIndex: 0,
        pointerEvents: 'none', opacity: 0.35,
      }}
    />
  )
}
