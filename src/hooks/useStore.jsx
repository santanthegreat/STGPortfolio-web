// ── hooks/useStore.js ────────────────────────────────────────────────────
// Central state store using React context + useReducer

import { createContext, useContext, useReducer, useCallback } from 'react'

const DEFAULT_SLOT = () => ({
  url: null, link: '', name: 'Project Name', client: 'Client',
  credits: [], trimStart: 0, trimEnd: null, frames: [], frameTypes: {},
})

const initialState = {
  isAdmin: false,
  pass: 'stg2025',
  slotCount: 6,
  slots: Object.fromEntries(Array.from({ length: 6 }, (_, i) => [i + 1, DEFAULT_SLOT()])),
  page: 'works',       // 'works' | 'posters'
  toast: null,
  activeModal: null,   // null | slotN (admin modal)
  viewerSlot: null,    // null | slotN (viewer modal)
  loading: true,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.payload }
    case 'SET_ADMIN': return { ...state, isAdmin: action.payload }
    case 'SET_PASS': return { ...state, pass: action.payload }
    case 'SET_PAGE': return { ...state, page: action.payload }
    case 'SET_TOAST': return { ...state, toast: action.payload }
    case 'SET_ACTIVE_MODAL': return { ...state, activeModal: action.payload }
    case 'SET_VIEWER': return { ...state, viewerSlot: action.payload }

    case 'INIT_SLOTS': {
      const { slotCount, slots } = action.payload
      return { ...state, slotCount, slots }
    }

    case 'SET_SLOT_COUNT': {
      const newSlots = { ...state.slots }
      for (let i = state.slotCount + 1; i <= action.payload; i++)
        newSlots[i] = DEFAULT_SLOT()
      return { ...state, slotCount: action.payload, slots: newSlots }
    }

    case 'UPDATE_SLOT': {
      const { n, data } = action.payload
      return {
        ...state,
        slots: { ...state.slots, [n]: { ...state.slots[n], ...data } },
      }
    }

    case 'DELETE_SLOT': {
      const n = action.payload
      const newSlots = {}
      let count = 0
      // Shift slots down
      for (let i = 1; i <= state.slotCount; i++) {
        if (i === n) continue
        count++
        newSlots[count] = { ...state.slots[i] }
      }
      // Fill remaining with empty
      for (let i = count + 1; i <= state.slotCount; i++)
        newSlots[i] = DEFAULT_SLOT()
      return { ...state, slots: newSlots }
    }

    case 'ADD_SLOT': {
      const n = state.slotCount + 1
      return {
        ...state,
        slotCount: n,
        slots: { ...state.slots, [n]: DEFAULT_SLOT() },
      }
    }

    default: return state
  }
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const showToast = useCallback((msg, isErr = false) => {
    dispatch({ type: 'SET_TOAST', payload: { msg, isErr } })
    setTimeout(() => dispatch({ type: 'SET_TOAST', payload: null }), isErr ? 4000 : 2500)
  }, [])

  return (
    <StoreContext.Provider value={{ state, dispatch, showToast }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  return useContext(StoreContext)
}

export { DEFAULT_SLOT }
