'use client'
import React, { useImperativeHandle, useRef, useState, useEffect } from 'react'
import { twMerge as tw } from 'tailwind-merge'
import { AnimatePresence, motion } from 'framer-motion'
import ProgressBase from './ProgressBase'

type State = 'error' | 'success'
export type ProgressNotifyHandle = {
   blink: (state: State, ms?: number, text?: string) => void
}

export default function ProgressNotify({
   children,
   ref,
}: {
   children?: React.ReactNode
   ref: React.Ref<ProgressNotifyHandle | null>
}) {
   const timeoutRef = useRef<number | null>(null)
   const [state, setState] = useState<State | undefined>(undefined)

   // expose methods to parent
   useImperativeHandle(
      ref,
      () => ({
         blink: (state, ms = 2000, text) => {
            if (timeoutRef.current) {
               window.clearTimeout(timeoutRef.current)
               timeoutRef.current = null
            }
            setState(state)

            timeoutRef.current = window.setTimeout(() => {
               setState(undefined)
               timeoutRef.current = null
            }, ms)
         },
      }),
      [],
   )

   useEffect(() => {
      return () => {
         if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
      }
   }, [])

   const color = state === 'error' ? 'bg-error' : state === 'success' ? 'bg-success' : 'bg-accent'
   return (
      <AnimatePresence>
         {state && (
            <motion.div
               className="fixed top-0 h-0.75 z-100000 w-screen transition-opacity duration-300 pointer-events-none"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
            >
               <ProgressBase value={100} color={color} disableAnimation />
               <div
                  className={tw(
                     'absolute top-1 right-0 z-1000 text-gray-800 text-xs px-1 rounded-bl-sm min-w-[100px] text-end pointer-events-auto',
                     color,
                  )}
               >
                  {children}
               </div>
            </motion.div>
         )}
      </AnimatePresence>
   )
}
