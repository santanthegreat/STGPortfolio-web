// ── lib/supabase.js ─────────────────────────────────────────────────────
// All Supabase interactions: save, load, delete
// Videos are hosted on YouTube, Vimeo, or Google Drive — no file uploads to Supabase Storage

const SB_URL = 'https://bdvpsarbtukfyaxqhggy.supabase.co'
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkdnBzYXJidHVrZnlheHFoZ2d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5OTk3NjYsImV4cCI6MjA4ODU3NTc2Nn0.-wYE06z4V0J89Wqmz_3AcomTI44ewNGryCqVsMigcKw' // ← Replace with eyJ... key from Supabase dashboard
const SB_BUCKET = 'stg-videos' // kept for poster/frame image uploads only

// ── Video URL Utilities ──────────────────────────────────────────────────

/**
 * Detect the platform from a video URL
 * @param {string} url
 * @returns {'youtube' | 'vimeo' | 'gdrive' | 'unknown'}
 */
export function detectPlatform(url) {
  if (!url) return 'unknown'
  if (url.match(/youtube\.com|youtu\.be/)) return 'youtube'
  if (url.match(/vimeo\.com/)) return 'vimeo'
  if (url.match(/drive\.google\.com/)) return 'gdrive'
  return 'unknown'
}

/**
 * Extract the video ID from a YouTube, Vimeo, or Google Drive URL
 * Supports: youtube.com/watch?v=, youtu.be/, vimeo.com/, drive.google.com/file/d/
 * @param {string} url
 * @returns {string | null}
 */
export function extractVideoId(url) {
  if (!url) return null

 // YouTube: watch?v=, embed/, youtu.be/, and shorts/
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  if (ytMatch) return ytMatch[1]

  // Vimeo: vimeo.com/ID or vimeo.com/video/ID
  const vmMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vmMatch) return vmMatch[1]

  // Google Drive: drive.google.com/file/d/FILE_ID/view
  const gdMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (gdMatch) return gdMatch[1]

  return null
}

/**
 * Convert any YouTube, Vimeo, or Google Drive URL into a clean embed URL
 * @param {string} url
 * @returns {string | null}
 */
export function toEmbedUrl(url) {
  const platform = detectPlatform(url)
  const id = extractVideoId(url)
  if (!id) return null

  if (platform === 'youtube')
    return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`

  if (platform === 'vimeo')
    return `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0`

  if (platform === 'gdrive')
    return `https://drive.google.com/file/d/${id}/preview`

  return null
}

/**
 * Generate a thumbnail URL from a video URL
 * YouTube only — Drive and Vimeo don't expose public thumbnails easily
 * @param {string} url
 * @returns {string | null}
 */
export function getThumbnail(url) {
  const platform = detectPlatform(url)
  const id = extractVideoId(url)
  if (!id) return null

  if (platform === 'youtube')
    return `https://img.youtube.com/vi/${id}/hqdefault.jpg`

  // Vimeo & Google Drive thumbnails aren't publicly accessible — return null
  return null
}

/**
 * Validate that a URL is a supported YouTube, Vimeo, or Google Drive link
 * @param {string} url
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateVideoUrl(url) {
  if (!url || !url.trim())
    return { valid: false, error: 'Please enter a video URL' }

  const platform = detectPlatform(url)
  if (platform === 'unknown')
    return { valid: false, error: 'Supported: YouTube, Vimeo, or Google Drive links' }

  const id = extractVideoId(url)
  if (!id)
    return { valid: false, error: 'Could not extract video ID — check the URL format' }

  // Extra check: Google Drive links must be shared ("Anyone with the link")
  if (platform === 'gdrive' && !url.includes('/file/d/'))
    return { valid: false, error: 'Use the Google Drive file link: drive.google.com/file/d/...' }

  return { valid: true }
}

/**
 * Get a human-readable platform label for UI display
 * @param {string} platform
 * @returns {string}
 */
export function getPlatformLabel(platform) {
  if (platform === 'youtube') return '▶ YouTube'
  if (platform === 'vimeo') return '▶ Vimeo'
  if (platform === 'gdrive') return '▶ Google Drive'
  return 'No video'
}

// ── Image/Frame upload (kept for posters & frame thumbnails) ─────────────
export async function sbUpload(path, blob, onProgress, onDone, onError) {
  if (blob.size > 50 * 1024 * 1024) {
    onError?.('File too large — keep under 50MB')
    return
  }

  try {
    const res = await fetch(
      `${SB_URL}/storage/v1/object/${SB_BUCKET}/${path}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SB_KEY}`,
          'x-upsert': 'true',
          'Content-Type': blob.type || 'video/mp4',
        },
        body: blob,
      }
    )

    if (res.ok) {
      onDone(`${SB_URL}/storage/v1/object/public/${SB_BUCKET}/${path}`)
    } else {
      const text = await res.text()
      console.error('Upload error', res.status, text)
      onError?.(`Upload failed: ${res.status} — ${text}`)
    }
  } catch (err) {
    console.error('Upload exception', err)
    onError?.('Upload failed — check your connection')
  }
}

// ── Save a slot row (upsert) ─────────────────────────────────────────────
export async function sbSave(row) {
  const res = await fetch(`${SB_URL}/rest/v1/slots?on_conflict=slot_n`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SB_KEY}`,
      apikey: SB_KEY,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(row),
  })
  return res.ok
}

// ── Load all slots ───────────────────────────────────────────────────────
export async function sbLoadSlots() {
  const res = await fetch(`${SB_URL}/rest/v1/slots?select=*&order=slot_n`, {
    headers: { Authorization: `Bearer ${SB_KEY}`, apikey: SB_KEY },
  })
  if (!res.ok) return []
  return res.json()
}

// ── Save config (slotCount, password) ───────────────────────────────────
export async function sbSaveConfig(data) {
  await fetch(`${SB_URL}/rest/v1/config?on_conflict=key`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SB_KEY}`,
      apikey: SB_KEY,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({ key: 'main', data: JSON.stringify(data) }),
  })
}

// ── Load config ──────────────────────────────────────────────────────────
export async function sbLoadConfig() {
  const res = await fetch(`${SB_URL}/rest/v1/config?select=*&key=eq.main`, {
    headers: { Authorization: `Bearer ${SB_KEY}`, apikey: SB_KEY },
  })
  if (!res.ok) return null
  const rows = await res.json()
  if (!rows?.[0]) return null
  try { return JSON.parse(rows[0].data) } catch { return null }
}

// ── Delete a slot ────────────────────────────────────────────────────────
export async function sbDeleteSlot(slotN) {
  await fetch(`${SB_URL}/rest/v1/slots?slot_n=eq.${slotN}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${SB_KEY}`, apikey: SB_KEY },
  })
}

// ── Clear a slot's video data (keep the slot row, reset to defaults) ─────
export async function sbClearSlot(slotN) {
  await fetch(`${SB_URL}/rest/v1/slots?slot_n=eq.${slotN}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${SB_KEY}`,
      apikey: SB_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Project Name',
      client: 'Client',
      credits: '[]',
      trim_start: 0,
      trim_end: null,
      video_url: null,
      embed_url: null,
      platform: 'unknown',
      thumbnail_url: null,
      link: '',
      preview_url: null,
      frame_urls: '[]',
      frame_types: '{}',
    }),
  })
}

// ── Build slot row for saving ────────────────────────────────────────────
export function buildSlotRow(n, slot) {
  return {
    slot_n: n,
    name: slot.name || 'Project Name',
    client: slot.client || 'Client',
    credits: JSON.stringify(slot.credits || []),
    trim_start: slot.trimStart || 0,
    trim_end: slot.trimEnd || null,
    video_url: slot.url || null,
    embed_url: toEmbedUrl(slot.url),
    platform: detectPlatform(slot.url),
    thumbnail_url: slot.thumbnail || getThumbnail(slot.url) || null,
    link: slot.link || '',
    preview_url: slot.previewUrl || null,
    frame_urls: JSON.stringify(slot.frames || []),
    frame_types: JSON.stringify(slot.frameTypes || {}),
  }
}

// ── Parse a slot row from Supabase ───────────────────────────────────────
export function parseSlotRow(d) {
  return {
    url: d.video_url || null,
    embedUrl: d.embed_url || toEmbedUrl(d.video_url) || null,
    platform: d.platform || detectPlatform(d.video_url),
    thumbnail: d.thumbnail_url || getThumbnail(d.video_url) || null,
    link: d.link || '',
    name: d.name || 'Project Name',
    client: d.client || 'Client',
    credits: safeJson(d.credits, []),
    trimStart: d.trim_start || 0,
    trimEnd: d.trim_end || null,
    previewUrl: d.preview_url || null,
    frames: safeJson(d.frame_urls, []),
    frameTypes: safeJson(d.frame_types, {}),
  }
}

function safeJson(str, fallback) {
  try { return JSON.parse(str || 'null') ?? fallback }
  catch { return fallback }
}


// ── Cloudinary upload (replaces sbUpload for preview clips) ──────────────
export async function cloudinaryUpload(blob, onProgress, onDone, onError) {
  const formData = new FormData()
  formData.append('file', blob)
  formData.append('upload_preset', 'p73ym4d9')
  formData.append('resource_type', 'video')

  const xhr = new XMLHttpRequest()
  xhr.open('POST', 'https://api.cloudinary.com/v1_1/drv2u4nvq/video/upload', true)

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable && onProgress)
      onProgress(Math.round((e.loaded / e.total) * 100))
  }

  xhr.onload = () => {
    if (xhr.status === 200) {
      const data = JSON.parse(xhr.responseText)
      onDone(data.secure_url)
    } else {
      console.error('Cloudinary error', xhr.status, xhr.responseText)
      onError?.(`Upload failed: ${xhr.status}`)
    }
  }

  xhr.onerror = () => onError?.('Network error')
  xhr.ontimeout = () => onError?.('Timeout — try a smaller file')
  xhr.timeout = 120000
  xhr.send(formData)
}






