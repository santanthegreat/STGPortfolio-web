import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useStore } from '../../hooks/useStore'
import { sbSave, buildSlotRow, sbSaveConfig } from '../../lib/supabase'

export default function Nav() {
  const { state, dispatch, showToast } = useStore()
  const { isAdmin, slots, slotCount, pass } = state
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname

  const [menuOpen, setMenuOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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

  function goTo(path) {
    navigate(path)
    setMenuOpen(false)
  }

  return (
    <nav className={`
      fixed top-0 left-0 right-0 z-[500]
      grid grid-cols-[1fr_auto_1fr] items-center
      px-7 transition-all duration-300
      ${scrolled
        ? 'py-3 bg-transparent border-transparent backdrop-filter-none'
        : 'py-[18px] bg-black/90 backdrop-blur-xl border-b border-white/[0.07]'
      }
    `}>

      {/* LEFT — Menu */}
      <div
        id="menuBtn"
        className="flex items-center gap-[9px] cursor-pointer relative select-none"
        onClick={() => setMenuOpen(o => !o)}
      >
        {/* Dots */}
        <div className="flex gap-1">
          {[0,1,2].map(i => (
            <span key={i} className={`w-[5px] h-[5px] rounded-full bg-cream block transition-opacity ${scrolled ? 'opacity-35' : ''}`} />
          ))}
        </div>
        <span className={`text-[0.62rem] tracking-[.22em] uppercase font-bold transition-opacity ${scrolled ? 'opacity-35' : ''}`}>
          Menu
        </span>
        {isAdmin && (
          <span className="text-[0.5rem] tracking-[.18em] uppercase bg-yellow-400/10 border border-yellow-400/40 text-yellow-300 px-2 py-[3px] rounded-full font-bold ml-1.5">
            Admin
          </span>
        )}

        {/* Menu Panel */}
        {menuOpen && (
          <div className="absolute top-[calc(100%+10px)] left-0 min-w-[230px] p-6 rounded-2xl z-[600]
            backdrop-blur-3xl bg-yellow-400/50 border border-white/20
            shadow-[0_12px_48px_rgba(0,0,0,.55),inset_0_1px_0_rgba(255,255,255,.28)]">
            <div className="text-[0.52rem] tracking-[.22em] uppercase text-black/45 italic mb-4">
             Currently viewing — {currentPath === '/' ? 'All Works' : 'Project Posters'}
            </div>
            <ul className="flex flex-col gap-0.5">
              {[
                { label: 'All Works', path: '/' },
                { label: 'Project Posters', path: '/posters' },
              ].map(({ label, path }) => (
                <li key={path}>
                  <a
                    onClick={() => goTo(path)}
                   className={`block text-[0.88rem] font-bold uppercase tracking-[.04em] text-white
  cursor-pointer px-2.5 py-[7px] rounded-xl mx-[-10px] transition-opacity hover:opacity-65
  ${currentPath === path ? 'opacity-100' : 'opacity-40'}`}
                  >
                    {label}
                  </a>
                </li>
              ))}
              {!isAdmin && (
                <li className="border-t border-white/20 pt-3 mt-2">
                  <a
                    onClick={() => { dispatch({ type: 'SET_ACTIVE_MODAL', payload: 'password' }); setMenuOpen(false) }}
                    className="block text-[0.88rem] font-bold uppercase tracking-[.04em] text-yellow-300 cursor-pointer px-2.5 py-[7px] rounded-xl mx-[-10px] transition-opacity hover:opacity-65"
                  >
                    ⚙ Admin
                  </a>
                </li>
              )}
              {isAdmin && (
                <li>
                  <a
                    onClick={handleLogout}
                    className="block text-[0.8rem] font-bold uppercase tracking-[.04em] text-red-400 cursor-pointer px-2.5 py-[7px] rounded-xl mx-[-10px] transition-opacity hover:opacity-65"
                  >
                    ✕ Logout
                  </a>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* CENTER — Logo */}
      <span
        className={`text-[1.2rem] font-bold tracking-[.1em] uppercase cursor-pointer
          text-gradient-silver filter drop-shadow-[0_1px_0_rgba(0,0,0,.9)]
          transition-opacity ${scrolled ? 'opacity-35' : ''}`}
        onClick={() => navigate('/')}
      >
        STG Studio
      </span>

      {/* RIGHT */}
      <div className="flex items-center justify-end gap-3">
        {/* Save button — admin only */}
        {isAdmin && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-yellow-300 bg-yellow-400/10 border border-yellow-400/40
              text-[0.52rem] tracking-[.18em] uppercase font-bold
              px-3 py-1 rounded-full cursor-pointer disabled:opacity-60 transition-opacity"
          >
            {saving ? '● SAVING...' : '● SAVE'}
          </button>
        )}

      {/* Info */}
<div
  id="infoBtn"
  className="flex items-center gap-[9px] cursor-pointer relative select-none"
  onMouseEnter={() => setInfoOpen(true)}
  onMouseLeave={() => setInfoOpen(false)}
>
          <span className={`w-2 h-2 rounded-full border-[1.5px] border-cream block transition-opacity ${scrolled ? 'opacity-35' : ''}`} />
          <span className={`text-[0.62rem] tracking-[.22em] uppercase font-bold transition-opacity ${scrolled ? 'opacity-35' : ''}`}>
            Info
          </span>

          {/* Info Panel */}
        {infoOpen && (
  <div className="absolute top-[calc(100%+10px)] right-0 w-[480px] max-w-[90vw] p-6 rounded-2xl z-[600]
    backdrop-blur-3xl bg-green-500/45 border border-white/20
    shadow-[0_12px_48px_rgba(0,0,0,.55),inset_0_1px_0_rgba(255,255,255,.28)]">
    <div className="grid grid-cols-[1.4fr_1fr] gap-6">
      
      {/* Left — Who We Are */}
      <div>
        <div className="text-[0.58rem] tracking-[.22em] uppercase text-white/70 font-semibold mb-2">Who We Are</div>
        <div className="text-[0.74rem] leading-[1.75] text-white">
          STG Studio is a creative video production company based in Lagos, Nigeria.
          We craft visual stories that move audiences.
        </div>
      </div>

      {/* Right — Contact stacked */}
      <div className="flex flex-col gap-4">
        {[
          { label: 'Phone', value: '+234 811 506 1690', href: 'tel:+2348115061690' },
          { label: 'Drop a Message', value: 'ebikhumisamuel@gmail.com', href: 'mailto:ebikhumisamuel@gmail.com' },
          { label: 'Instagram', value: '@santanthegreat', href: 'https://instagram.com/santanthegreat' },
        ].map(({ label, value, href }) => (
          <div key={label}>
            <div className="text-[0.58rem] tracking-[.2em] uppercase text-white/65 font-semibold mb-0.5">{label}</div>
            <a href={href} target="_blank" rel="noreferrer"
              className="text-[0.74rem] font-medium text-white block break-all">
              {value}
            </a>
          </div>
        ))}
      </div>

    </div>
  </div>
)}
        </div>
      </div>
    </nav>
  )
}










