import { create } from 'zustand'

/** How long the footer stays highlighted, in ms. */
export const FOOTER_SHINE_DURATION = 1800

type FooterShineStore = {
   /** true while the footer should be highlighted */
   shining: boolean
   /** increments on every trigger so the CSS animation restarts */
   shineId: number
   /** duration of the current (or last) highlight, in ms */
   duration: number
   /** highlight the footer for a short moment (optionally override the duration in ms) */
   shine: (duration?: number) => void
   /** stop the highlight immediately */
   stop: () => void
}

let shineTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Tiny global store so any component can highlight the footer.
 * Use the `shine` action from a component, or `triggerFooterShine()` outside React.
 */
export const useFooterShine = create<FooterShineStore>((set) => ({
   shining: false,
   shineId: 0,
   duration: FOOTER_SHINE_DURATION,

   shine: (duration) => {
      const ms =
         typeof duration === 'number' && Number.isFinite(duration) && duration > 0 ? duration : FOOTER_SHINE_DURATION
      if (shineTimer) clearTimeout(shineTimer)
      set((state) => ({ shining: true, shineId: state.shineId + 1, duration: ms }))
      shineTimer = setTimeout(() => {
         shineTimer = null
         set({ shining: false })
      }, ms)
   },

   stop: () => {
      if (shineTimer) clearTimeout(shineTimer)
      shineTimer = null
      set({ shining: false })
   },
}))

/** Imperative trigger - usable outside React (event handlers, non-component code). */
export function triggerFooterShine(duration?: number) {
   useFooterShine.getState().shine(duration)
}
