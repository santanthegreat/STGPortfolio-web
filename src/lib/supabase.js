// ── lib/supabase.js ─────────────────────────────────────────────────────
// All Supabase interactions: upload, save, load, delete

const SB_URL = 'https://arxjxsblzubtlodgzxkn.supabase.co'
const SB_KEY = 'sb_publishable_fNTW0MZV83d5SGHKloDsBQ__vshmrGI'
const SB_BUCKET = 'stg-videos'

// ── Storage upload ───────────────────────────────────────────────────────
export function sbUpload(path, blob, onProgress, onDone, onError) {
  const xhr = new XMLHttpRequest()
  xhr.open('POST', `${SB_URL}/storage/v1/object/${SB_BUCKET}/${path}`, true)
  xhr.setRequestHeader('Authorization', `Bearer ${SB_KEY}`)
  xhr.setRequestHeader('x-upsert', 'true')
  xhr.setRequestHeader('Content-Type', blob.type || 'video/mp4')
  xhr.timeout = 600000

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable && onProgress)
      onProgress(Math.round((e.loaded / e.total) * 100))
  }
  xhr.onload = () => {
    if (xhr.status === 200 || xhr.status === 201) {
      onDone(`${SB_URL}/storage/v1/object/public/${SB_BUCKET}/${path}`)
    } else {
      console.error('Supabase upload error', xhr.status, xhr.responseText)
      onError?.(`Upload error: ${xhr.status}`)
    }
  }
  xhr.onerror = () => onError?.('Network error')
  xhr.ontimeout = () => onError?.('Timeout')
  xhr.send(blob)
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
    link: slot.link || '',
    frame_urls: JSON.stringify(slot.frames || []),
    frame_types: JSON.stringify(slot.frameTypes || {}),
  }
}

// ── Parse a slot row from Supabase ───────────────────────────────────────
export function parseSlotRow(d) {
  return {
    url: d.video_url || null,
    link: d.link || '',
    name: d.name || 'Project Name',
    client: d.client || 'Client',
    credits: safeJson(d.credits, []),
    trimStart: d.trim_start || 0,
    trimEnd: d.trim_end || null,
    frames: safeJson(d.frame_urls, []),
    frameTypes: safeJson(d.frame_types, {}),
  }
}

function safeJson(str, fallback) {
  try { return JSON.parse(str || 'null') ?? fallback }
  catch { return fallback }
}
