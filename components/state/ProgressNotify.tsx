'use client'
import React, { useImperativeHandle, useRef, useState, useEffect } from 'react'
import { LinearProgress } from '@mui/material'
import { twMerge as tw } from 'tailwind-merge'
import { AnimatePresence, motion } from 'framer-motion'

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

   return (
      <AnimatePresence>
         {state && (
            <motion.div
               className={tw(
                  'fixed top-0 h-0.75 z-100000 w-screen transition-opacity duration-300 pointer-events-none',
                  state === 'error' && 'text-error',
                  state === 'success' && 'text-success',
               )}
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
            >
               <LinearProgress variant="determinate" value={100} color="inherit" />
               <div
                  className={tw(
                     'absolute top-1 right-0 z-1000 text-gray-800 text-xs px-1 rounded-bl-sm min-w-[100px] text-end pointer-events-auto',
                     state === 'error' && ' bg-error',
                     state === 'success' && ' bg-success',
                  )}
               >
                  {children}
               </div>
            </motion.div>
         )}
      </AnimatePresence>
   )
}
