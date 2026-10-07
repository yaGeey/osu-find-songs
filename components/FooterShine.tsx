'use client'

import { useFooterShine } from '@/contexts/useFooterShine'
import type { CSSProperties, ReactNode } from 'react'

type FooterShineProps = {
   children: ReactNode
   /** Accent colour mixed into the light sweep. Any CSS colour. */
   shineBase?: string
   className?: string
   /** Also replay the shine when the pointer enters the wrapper. Off by default. */
   triggerOnHover?: boolean
}

/**
 * Wraps footer content and lets its text light up for a moment.
 * Text inside should carry the `footer-shine-text` class (see `Footer`).
 * Trigger it with `useFooterShine().shine` / `triggerFooterShine()`.
 */
export function FooterShine({
   children,
   shineBase = 'var(--color-brand-osu)',
   className,
   triggerOnHover = false,
}: FooterShineProps) {
   const shining = useFooterShine((state) => state.shining)
   const shineId = useFooterShine((state) => state.shineId)
   const shine = useFooterShine((state) => state.shine)
   const duration = useFooterShine((state) => state.duration)

   return (
      <div
         // re-mounting on each trigger restarts the CSS animation, even on rapid re-triggers
         key={shineId}
         className={['footer-shine', shining && 'footer-shine--shining', className].filter(Boolean).join(' ')}
         style={{ '--shine-base': shineBase, '--shine-duration': `${duration}ms` } as CSSProperties}
         onPointerEnter={triggerOnHover ? () => shine() : undefined}
      >
         {children}
      </div>
   )
}
