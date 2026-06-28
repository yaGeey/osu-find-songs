'use client'
import React, { useImperativeHandle, useRef, useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { twMerge } from 'tailwind-merge'
import ProgressBase from './ProgressBase'

export type Message = { type: 'error' | 'success' | 'warn'; content?: string }
type QueueItem = Message & { id: string }

export type NotifyHandle = {
   blink: (state: Message, ms?: number) => void
}

export function NotifyHeader({ ref, children }: { ref: React.Ref<NotifyHandle | null>; children?: React.ReactNode }) {
   const timeoutsMap = useRef<Map<string, number>>(new Map())
   const [messages, setMessages] = useState<QueueItem[]>([])

   useImperativeHandle(
      ref,
      () => ({
         blink: (state, ms = 2000) => {
            const id = crypto.randomUUID()
            setMessages((p) => [...p, { ...state, id }])

            const timer = window.setTimeout(() => {
               setMessages((p) => p.filter((m) => m.id !== id))
               timeoutsMap.current.delete(id)
            }, ms)

            timeoutsMap.current.set(id, timer)
         },
      }),
      [],
   )

   useEffect(() => {
      return () => {
         timeoutsMap.current.forEach((timer) => window.clearTimeout(timer))
         timeoutsMap.current.clear()
      }
   }, [])

   const colors = getColors(messages.at(-1))
   return (
      <>
         <AnimatePresence>
            {messages.length > 0 && (
               <motion.div
                  className="fixed top-0 h-0.75 z-100000 w-screen transition-opacity duration-300 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
               >
                  <ProgressBase value={100} color={colors.progressBar} disableAnimation />
               </motion.div>
            )}
         </AnimatePresence>
         <AnimatePresence>
            {(children || messages.length > 0) && (
               <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.95 }}
                  className={twMerge(
                     'h-8 flex flex-col absolute left-1/2 -translate-x-1/2 font-semibold px-3 py-1 rounded-md max-w-[30%] w-full min-w-fit text-center overflow-hidden text-ellipsis',
                     colors ? colors.messageBg : 'bg-main/40',
                     colors ? colors.message : 'text-main-gray',
                  )}
               >
                  {messages
                     .filter((m) => m.content)
                     .map((m) => (
                        <motion.p
                           layout
                           key={m.id}
                           initial={{ opacity: 0, y: -5 }}
                           animate={{ opacity: 1, y: 0 }}
                           className="wrap-anywhere"
                        >
                           {m.content}
                        </motion.p>
                     ))}
                  {children && <motion.p layout>{children}</motion.p>}
               </motion.div>
            )}
         </AnimatePresence>
      </>
   )
}

export function ProgressNotify({ children, ref }: { children?: React.ReactNode; ref: React.Ref<NotifyHandle | null> }) {
   const timeoutRef = useRef<number | null>(null)
   const [message, setMessage] = useState<Message | undefined>(undefined)

   useImperativeHandle(
      ref,
      () => ({
         blink: (state, ms = 2000) => {
            if (timeoutRef.current) {
               window.clearTimeout(timeoutRef.current)
               timeoutRef.current = null
            }
            setMessage(state)

            timeoutRef.current = window.setTimeout(() => {
               setMessage(undefined)
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

   const color = message?.type === 'error' ? 'bg-error' : message?.type === 'success' ? 'bg-success' : 'bg-accent'
   return (
      <AnimatePresence>
         {message && (
            <motion.div
               className="fixed top-0 h-0.75 z-100000 w-screen transition-opacity duration-300 pointer-events-none"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
            >
               <ProgressBase value={100} color={color} disableAnimation />
               <div
                  className={twMerge(
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

type Colors = { progressBar: string; message?: string; messageBg?: string }
function getColors(state: Message | undefined): Colors {
   let colors: Colors | undefined
   switch (state?.type) {
      case 'error':
         colors = { progressBar: 'bg-error', message: 'text-black', messageBg: 'bg-error/20' }
         break
      case 'success':
         colors = { progressBar: 'bg-success', message: 'text-black', messageBg: 'bg-success/20' }
         break
      case 'warn':
         colors = { progressBar: 'bg-warn', message: 'text-black', messageBg: 'bg-warn/20' }
         break
      case undefined:
         colors = { progressBar: '', message: 'text-main-gray', messageBg: 'bg-main/40' }
         break
   }
   if (state?.content === undefined)
      return { progressBar: colors.progressBar, message: 'text-main-gray', messageBg: 'bg-main/40' }
   return colors
}
