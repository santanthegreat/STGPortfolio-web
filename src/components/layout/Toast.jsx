// ── components/Toast.jsx ─────────────────────────────────────────────────
import { useStore } from '../../hooks/useStore'

export default function Toast() {
  const { state } = useStore()
  const { toast } = state

  return (
    <div
      id="vwc"
      className={toast ? 'show' : ''}
      style={{ borderColor: toast?.isErr ? 'rgba(255,60,60,.5)' : 'rgba(255,255,255,.15)' }}
    >
      {toast?.msg}
    </div>
  )
}
