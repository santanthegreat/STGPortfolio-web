// ── components/PasswordOverlay.jsx ──────────────────────────────────────
import { useState } from 'react'
import { useStore } from '../hooks/useStore'
import { sbSaveConfig } from '../lib/supabase'

export default function PasswordOverlay() {
  const { state, dispatch, showToast } = useStore()
  const { pass } = state
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [mode, setMode] = useState('login') // 'login' | 'reset'
  const [newPass, setNewPass] = useState('')
  const [newPass2, setNewPass2] = useState('')

  function handleLogin() {
    if (value === 'stgrecovery') { setMode('reset'); setError(''); return }
    if (value === pass) {
      dispatch({ type: 'SET_ADMIN', payload: true })
      dispatch({ type: 'SET_ACTIVE_MODAL', payload: null })
      setValue('')
      setError('')
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

  return (
    <div id="pw-ov" className="show">
      <div className="pw-box">
        <span className="pw-logo">STG Studio</span>

        {mode === 'login' ? (
          <>
            <div className="pw-sub">Admin Access</div>
            <input
              className="pw-in"
              type="password"
              placeholder="Password"
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              autoFocus
            />
            <button className="pw-go" onClick={handleLogin}>Enter</button>
          </>
        ) : (
          <>
            <div className="pw-sub">Set New Password</div>
            <input
              className="pw-in"
              type="password"
              placeholder="New password"
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            <input
              className="pw-in"
              type="password"
              placeholder="Confirm password"
              value={newPass2}
              onChange={e => setNewPass2(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleReset()}
            />
            <button className="pw-go" onClick={handleReset}>Set Password</button>
          </>
        )}

        <div className={`pw-err${error ? ' show' : ''}`}>{error}</div>
      </div>
    </div>
  )
}
