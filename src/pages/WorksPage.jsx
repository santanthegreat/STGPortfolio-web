import { useStore } from '../hooks/useStore'
import WorkSlot from '../components/works/WorkSlot'
import { sbSaveConfig } from '../lib/supabase'

export default function WorksPage() {
  const { state, dispatch, showToast } = useStore()
  const { slots, slotCount, isAdmin, pass } = state

  async function addSlot() {
    dispatch({ type: 'ADD_SLOT' })
    await sbSaveConfig({ slotCount: slotCount + 1, pass })
    showToast('Slot added ✓')
  }

  return (
    <div className="min-h-screen">

      {/* Grid section */}
      <div className="pt-20">
        {isAdmin && (
          <div className="flex justify-end px-6 pt-[88px] pb-1">
            <button
              onClick={addSlot}
              className="bg-yellow-400/10 border border-yellow-400/35 text-yellow-300
                font-sans text-[0.58rem] font-bold tracking-[.16em] uppercase
                px-4 py-[7px] cursor-pointer rounded-xl hover:bg-yellow-400/20 transition-colors"
            >
              + Add Slot
            </button>
          </div>
        )}
        {!isAdmin && <div className="h-[88px]" />}

        <div className="grid grid-cols-3 gap-2 px-6 max-[900px]:grid-cols-2 max-[420px]:grid-cols-1">
          {Array.from({ length: slotCount }, (_, i) => i + 1).map(n => (
            <WorkSlot key={n} n={n} />
          ))}
        </div>
      </div>

      {/* Tagline */}
      <section className="px-7 py-[72px] text-center">
        <h2 className="text-[clamp(1.8rem,5vw,4.8rem)] font-light leading-[1.18] max-w-[720px]
          tracking-[-0.02em] mx-auto">
          Making videos that{' '}
          <strong className="font-black text-gradient-gold">move</strong>
          {' '}audiences
        </h2>
        <p className="mt-4 text-[0.62rem] tracking-[.22em] uppercase text-cream/38 font-medium">
          Samuel Ebikhumi &nbsp;&middot;&nbsp; santanthegreat &nbsp;&middot;&nbsp; Lagos
        </p>
        <a
          href="mailto:ebikhumisamuel@gmail.com"
          className="inline-block mt-7 italic text-[clamp(1rem,2.5vw,1.9rem)] font-light
            tracking-[.02em] text-[#00c05a] border-b border-[rgba(0,192,90,.35)] pb-1"
        >
          Get in touch
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t border-cream/[0.08] px-7 pt-[52px] pb-11 grid grid-cols-2 gap-10 items-end max-[420px]:grid-cols-1">
        <div className="flex flex-col gap-1.5">
          <a href="mailto:santanthegreat@gmail.com" className="text-[0.8rem] text-cream/55 no-underline">
            ebikhumisamuel@gmail.com
          </a>
          <a href="tel:+2348115061690" className="text-[0.8rem] text-cream/55 no-underline">
            +234 811 506 1690
          </a>
        </div>
        <div className="flex items-end justify-end flex-col">
          <div className="text-[0.86rem] font-medium tracking-[.1em] uppercase mb-[18px]">STG Studio</div>
          <div className="flex gap-5">
            <a className="flex text-cream/50 no-underline" href="https://instagram.com/santanthegreat" target="_blank" rel="noreferrer">
              <svg className="w-[18px] h-[18px] fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a className="flex text-cream/50 no-underline" href="#" title="TikTok">
              <svg className="w-[18px] h-[18px] fill-current" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
              </svg>
            </a>
          </div>
        </div>
        <div className="col-span-2 border-t border-cream/[0.08] pt-[18px] flex justify-between flex-wrap gap-2 max-[420px]:col-span-1">
          <span className="text-[0.58rem] tracking-[.2em] uppercase text-cream/32">
            STG Studio &middot; Samuel Ebikhumi &middot; &copy; 2025
          </span>
          <span className="text-[0.58rem] tracking-[.2em] uppercase text-cream/32">santanthegreat</span>
        </div>
      </footer>
    </div>
  )
}

