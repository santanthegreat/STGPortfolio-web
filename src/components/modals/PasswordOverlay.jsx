import { useState } from 'react'
import { useStore } from '../../hooks/useStore'
import { sbSaveConfig } from '../../lib/supabase'

export default function PasswordOverlay() {
  const { state, dispatch, showToast } = useStore()
  const { pass } = state
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [mode, setMode] = useState('login')
  const [newPass, setNewPass] = useState('')
  const [newPass2, setNewPass2] = useState('')

  function handleLogin() {
    if (value === 'stgrecovery') { setMode('reset'); setError(''); return }
    if (value === pass) {
      dispatch({ type: 'SET_ADMIN', payload: true })
      dispatch({ type: 'SET_ACTIVE_MODAL', payload: null })
      setValue(''); setError('')
    } else {
      setError('Incorrect password')
    }
  }

  async function handleReset() {
    if (!newPass) { setError('Enter a new password'); return }
    if (newPass !== newPass2) { setError('Passwords do not match'); return }
    dispatch({ type: 'SET_PASS', payload: newPass })
    await sbSaveConfig({ pass: newPass })
    showToast('Password updated ✓')
    dispatch({ type: 'SET_ACTIVE_MODAL', payload: null })
    setMode('login')
    setNewPass(''); setNewPass2(''); setValue('')
  }

  const inputCls = `w-full bg-white/5 border border-white/12 rounded-xl text-cream
    font-sans text-[0.9rem] px-4 py-3.5 outline-none text-center tracking-[.12em]
    min-h-[52px] mb-2 focus:border-yellow-400/60 transition-colors`

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center
      bg-black/85 backdrop-blur-2xl">
      <div className="bg-[rgba(14,14,14,0.95)] border border-white/13 rounded-3xl
        p-10 min-w-[min(320px,90vw)] text-center
        shadow-[0_20px_70px_rgba(0,0,0,.75),inset_0_1px_0_rgba(255,255,255,.1)]">

        <span className="text-gradient-logo text-[0.85rem] font-bold tracking-[.14em] uppercase block mb-5">
          STG Studio
        </span>

        {mode === 'login' ? (
          <>
            <div className="text-[0.56rem] tracking-[.24em] uppercase text-cream/32 mb-5">
              Admin Access
            </div>
            <input
              className={inputCls}
              type="password"
              placeholder="Password"
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              autoFocus
            />
            <button
              onClick={handleLogin}
              className="w-full bg-yellow-400/10 border border-yellow-400/32 rounded-xl
                text-yellow-300 font-sans text-[0.64rem] font-bold tracking-[.2em] uppercase
                py-3.5 cursor-pointer min-h-[52px] hover:bg-yellow-400/20 transition-colors"
            >
              Enter
            </button>
          </>
        ) : (
          <>
            <div className="text-[0.56rem] tracking-[.24em] uppercase text-cream/32 mb-5">
              Set New Password
            </div>
            <input
              className={inputCls}
              type="password"
              placeholder="New password"
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
            />
            <input
              className={inputCls}
              type="password"
              placeholder="Confirm password"
              value={newPass2}
              onChange={e => setNewPass2(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleReset()}
            />
            <button
              onClick={handleReset}
              className="w-full bg-yellow-400/10 border border-yellow-400/32 rounded-xl
                text-yellow-300 font-sans text-[0.64rem] font-bold tracking-[.2em] uppercase
                py-3.5 cursor-pointer min-h-[52px] hover:bg-yellow-400/20 transition-colors"
            >
              Set Password
            </button>
          </>
        )}

        {error && (
          <div className="mt-2.5 text-[0.56rem] tracking-[.14em] uppercase text-red-400">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}










