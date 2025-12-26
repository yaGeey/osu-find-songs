// ProgressNotificate.tsx
'use client'
import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react'
import { LinearProgress } from '@mui/material'
import { twMerge as tw } from 'tailwind-merge'

export type ProgressNotifyHandle = {
   blink: (ms?: number) => void
}

export default function ProgressNotify({
   children,
   color = 'text-accent',
   textBgColor = 'bg-accent/30',
   ref,
}: {
   children?: React.ReactNode
   color?: string
   textBgColor?: string
   ref: React.Ref<ProgressNotifyHandle | null>
}) {
   const [visible, setVisible] = useState<boolean>(false)
   const timeoutRef = useRef<number | null>(null)

   // expose methods to parent
   useImperativeHandle(
      ref,
      () => ({
         blink: (ms = 1000) => {
            if (timeoutRef.current) {
               window.clearTimeout(timeoutRef.current)
               timeoutRef.current = null
            }
            setVisible(true)
            timeoutRef.current = window.setTimeout(() => {
               setVisible(false)
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
      <div
         className={tw('fixed top-0 h-0.75 z-100000 w-screen transition-opacity duration-300 pointer-events-none', color)}
         style={{ opacity: visible ? 1 : 0 }}
      >
         <LinearProgress variant="determinate" value={100} color="inherit" />
         <div
            className={tw(
               'absolute top-1 right-0 z-1000 text-gray-800 text-xs px-1 rounded-bl-sm min-w-[100px] text-end pointer-events-auto',
               textBgColor,
            )}
         >
            {children}
         </div>
      </div>
   )
}
