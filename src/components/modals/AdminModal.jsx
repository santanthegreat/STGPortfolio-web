import { useState, useEffect, useRef } from 'react'
import { useStore } from '../../hooks/useStore'
import {
  sbSave,  cloudinaryUpload , buildSlotRow,
  validateVideoUrl, toEmbedUrl, detectPlatform, getPlatformLabel
} from '../../lib/supabase'

export default function AdminModal() {
  const { state, dispatch, showToast } = useStore()
  const { activeModal, slots } = state
  const n = activeModal
  const slot = n ? slots[n] : null
  const previewFileRef = useRef(null)

  const [name, setName] = useState('')
  const [client, setClient] = useState('')
  const [link, setLink] = useState('')
  const [credits, setCredits] = useState([])
  const [credOpen, setCredOpen] = useState(false)

  // Video URL state
  const [videoUrl, setVideoUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const [urlSaved, setUrlSaved] = useState(false)

  // Preview upload state
  const [previewUploading, setPreviewUploading] = useState(false)
  const [previewProgress, setPreviewProgress] = useState(0)

  useEffect(() => {
    if (!slot) return
    setName(slot.name || '')
    setClient(slot.client || '')
    setLink(slot.link || '')
    setCredits(slot.credits || [])
    setVideoUrl(slot.url || '')
    setUrlSaved(!!slot.url)
    setUrlError('')
  }, [n])

  if (!n || !slot || activeModal === 'password') return null

  function close() { dispatch({ type: 'SET_ACTIVE_MODAL', payload: null }) }

  // Save URL
  async function handleSaveUrl() {
    if (!videoUrl.trim()) {
      setUrlError('Please enter a URL')
      return
    }
    const { valid, error } = validateVideoUrl(videoUrl)
    if (!valid) { setUrlError(error); return }

    const embedUrl = toEmbedUrl(videoUrl)
    const updated = { ...slot, url: videoUrl, embedUrl }
    dispatch({ type: 'UPDATE_SLOT', payload: { n, data: updated } })
    await sbSave(buildSlotRow(n, updated))
    setUrlSaved(true)
    setUrlError('')
    showToast('Video URL saved ✓')
  }

  // Upload preview clip
 function handlePreviewUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  const mb = file.size / 1024 / 1024
  if (mb > 100) {
    showToast(`Too large (${mb.toFixed(0)}MB) — keep under 100MB`, true)
    return
  }
  setPreviewUploading(true)
  setPreviewProgress(0)

  cloudinaryUpload(
    file,
    (pct) => setPreviewProgress(pct),
    async (uploadedUrl) => {
      dispatch({ type: 'UPDATE_SLOT', payload: { n, data: { previewUrl: uploadedUrl } } })
      await sbSave(buildSlotRow(n, { ...slot, previewUrl: uploadedUrl }))
      setPreviewUploading(false)
      showToast('Preview clip saved ✓')
    },
    (err) => {
      setPreviewUploading(false)
      showToast(`Upload failed: ${err}`, true)
    }
  )
}

  // Save details
  async function save(overrides = {}) {
    const updated = { ...slot, name, client, link, credits, ...overrides }
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

  const hasUrl = urlSaved || !!slot.url
  const hasPreview = !!slot.previewUrl
  const platform = detectPlatform(videoUrl || slot.url)

  const inputCls = `w-full bg-white/5 border border-white/10 rounded-lg text-cream
  font-sans text-[0.75rem] px-3 py-2.5 outline-none placeholder:text-cream/50
  focus:border-white/25 transition-colors`

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-xl cursor-pointer" onClick={close} />

      <div className="relative w-full max-w-[880px] z-[1] bg-[rgba(10,10,10,0.96)]
        rounded-t-3xl border border-white/10 border-b-0
        shadow-[0_-16px_64px_rgba(0,0,0,.7),inset_0_1px_0_rgba(255,255,255,.12)]
        max-h-[92vh] overflow-y-auto vm-sheet-open">

        <div className="w-9 h-1 bg-white/20 rounded-full mx-auto mt-2.5 cursor-pointer" onClick={close} />

        <div className="p-5 pb-14">
          {/* Back */}
          <button onClick={close} className="flex items-center gap-1.5 text-cream/40 text-[0.58rem]
            tracking-[.18em] uppercase font-bold mb-5 bg-transparent border-none cursor-pointer
            hover:text-cream/70 transition-colors">
            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            Back
          </button>

          {/* ── SECTION 1: Video URL ─────────────────────────────── */}
          <div className="mb-5 bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
            <div className="text-[0.52rem] tracking-[.2em] uppercase text-cream/40 font-medium mb-3">
              Full Video URL
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => { setVideoUrl(e.target.value); setUrlSaved(false); setUrlError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveUrl()}
                placeholder="YouTube or Google Drive link..."
                className={inputCls + ' flex-1'}
              />
              <button
                onClick={handleSaveUrl}
                className="bg-yellow-400/12 border border-yellow-400/40 text-yellow-300
                  text-[0.55rem] font-bold tracking-[.12em] uppercase px-3 py-2 rounded-lg
                  cursor-pointer whitespace-nowrap hover:bg-yellow-400/20 transition-colors"
              >
                {urlSaved ? '✓ Saved' : 'Save URL'}
              </button>
            </div>
            {urlError && <div className="text-red-400 text-[0.65rem] mt-1.5">{urlError}</div>}
            {urlSaved && (
              <div className="text-[0.52rem] tracking-[.12em] uppercase text-cream/30 mt-1.5">
                {getPlatformLabel(platform)}
              </div>
            )}
          </div>

          {/* ── SECTION 2: Preview Clip ──────────────────────────── */}
          <div className="mb-5 bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
            <div className="text-[0.52rem] tracking-[.2em] uppercase text-cream/40 font-medium mb-3">
              Preview Clip <span className="text-cream/20 normal-case tracking-normal">— short autoplay (max 50MB)</span>
            </div>

            {hasPreview ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-[0.62rem] text-cream/50">Preview clip uploaded</span>
                </div>
                <button
                  onClick={() => previewFileRef.current?.click()}
                  className="bg-white/8 border border-white/14 text-cream/60
                    text-[0.55rem] font-bold tracking-[.12em] uppercase px-3 py-2
                    rounded-lg cursor-pointer hover:text-cream transition-colors"
                >
                  Replace
                </button>
              </div>
            ) : (
              <button
                onClick={() => previewFileRef.current?.click()}
                disabled={previewUploading}
                className="w-full border border-dashed border-white/20 text-cream/40
                  text-[0.58rem] font-bold tracking-[.14em] uppercase py-4 rounded-lg
                  cursor-pointer hover:border-white/40 hover:text-cream/60 transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {previewUploading
                  ? `Uploading...%`
                  : '↑ Upload Preview Clip'}
              </button>
            )}

            {/* Progress bar */}
            {previewUploading && (
              <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-300 rounded-full transition-all duration-300"
                  style={{ width: `${previewProgress}%` }}
                />
              </div>
            )}

            <input
              ref={previewFileRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handlePreviewUpload}
            />
          </div>

         {/* ── SECTION 3: Details ───────────────────────────────── */}
<div className="mb-5 bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
  <div className="text-[0.52rem] tracking-[.2em] uppercase text-cream/40 font-medium mb-3">
    Project Details
  </div>
  <input
    value={name}
    onChange={e => setName(e.target.value)}
    placeholder="Project Name"
    className={inputCls + ' mb-2'}
  />
  <input
    value={client}
    onChange={e => setClient(e.target.value)}
    placeholder="Client"
    className={inputCls}
  />
</div>

          <div className="mb-4">
            <div className="text-[0.52rem] tracking-[.18em] uppercase text-cream/38 mb-1.5">
              Watch Link
            </div>
            <input
              value={link}
              onChange={e => setLink(e.target.value)}
              placeholder="https://..."
              type="url"
              className={inputCls}
            />
          </div>

          {/* Credits */}
          <button
            onClick={() => setCredOpen(o => !o)}
            className="mt-2 bg-transparent border border-white/13 text-cream/38
              font-sans text-[0.53rem] font-bold tracking-[.15em] uppercase
              px-3.5 py-2 cursor-pointer rounded-lg hover:text-cream/60 transition-colors"
          >
            {credOpen ? 'Hide Credits' : 'Edit Credits'}
          </button>

          {credOpen && (
            <div className="mt-3 bg-white/[0.03] border border-white/[0.09] rounded-xl p-4">
              {credits.map((c, i) => (
                <div key={i} className="flex gap-2 mb-2 items-center">
                  <input placeholder="Role" value={c.role}
                    onChange={e => updateCredit(i, 'role', e.target.value)}
                    className={inputCls + ' flex-1'} />
                  <input placeholder="Name" value={c.name}
                    onChange={e => updateCredit(i, 'name', e.target.value)}
                    className={inputCls + ' flex-1'} />
                  <button onClick={() => removeCredit(i)}
                    className="bg-transparent border-none text-cream/28 text-base cursor-pointer px-1.5 min-w-[44px]">
                    ✕
                  </button>
                </div>
              ))}
              <button onClick={addCredit}
                className="w-full bg-transparent border border-dashed border-white/16 text-cream/35
                  font-sans text-[0.56rem] font-bold tracking-[.14em] uppercase py-2.5
                  cursor-pointer rounded-lg mt-1">
                + Add Credit
              </button>
            </div>
          )}

          {/* Save */}
          <button
            onClick={() => save()}
            className="mt-4 w-full bg-yellow-400/12 border border-yellow-400/40 text-yellow-300
              font-sans text-[0.56rem] font-bold tracking-[.14em] uppercase
              py-3 cursor-pointer rounded-lg hover:bg-yellow-400/20 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}








