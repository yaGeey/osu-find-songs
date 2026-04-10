'use client'
import { ArrowLeft, ArrowRight, MessageSquareWarning } from 'lucide-react'
import { motion } from 'framer-motion'
import React, { useEffect } from 'react'
import { Banner } from '@/lib/telemetry'
import { twMerge } from 'tailwind-merge'

export default function Banners({ banners }: { banners: Banner[] }) {
   const ids = banners.map((b) => b.id).join(',')
   const [isOpen, setIsOpen] = React.useState(false)
   useEffect(() => {
      if (localStorage.getItem('banners_closed') == ids) setIsOpen(false) // eslint-disable-line react-hooks/set-state-in-effect
   }, [ids])
   const [current, setCurrent] = React.useState(0)
   const [isClosable, setIsClosable] = React.useState(false)
   useEffect(() => {
      if (!banners || banners.length === 0) return
      const currentId = banners[current].id
      localStorage.setItem(`banner_${currentId}`, '1')
      setIsClosable(banners.every((b) => localStorage.getItem(`banner_${b.id}`) === '1')) // eslint-disable-line react-hooks/set-state-in-effect
   }, [current, banners])
   return (
      <motion.div
         className="relative bg-white flex items-center text-black rounded-3xl border-2 border-main-border py-1 h-10 gap-2 overflow-hidden px-3 min-w-10"
         initial={false}
         animate={{ width: isOpen ? '100%' : '2.5rem' }}
         transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
         <motion.div
            animate={{ opacity: isOpen ? 1 : 0 }}
            transition={{ duration: 0.1, delay: isOpen ? 0.1 : 0 }}
            className="gap-3 flex items-center justify-between mr-7 w-full"
            title={banners[current].content}
         >
            {banners.length > 1 && current !== 0 && (
               <ArrowLeft
                  className="text-main-border hover:scale-110 active:scale-95 "
                  onClick={() => setCurrent((p) => p - 1)}
               />
            )}
            <div className="flex-1 overflow-hidden text-ellipsis line-clamp-2 min-w-0 text-sm/tight">
               {banners[current].content}
            </div>
            <div suppressHydrationWarning className="text-xs/tight rounded-lg px-1 text-main-border grid items-center justify-center tracking-tight">
               <span suppressHydrationWarning>{banners[current].created_at.toLocaleDateString()}</span>
               <span suppressHydrationWarning>{banners[current].created_at.toLocaleTimeString()}</span>
            </div>
            {banners.length > 1 && current !== banners.length - 1 && (
               <ArrowRight
                  className="text-main-border hover:scale-110 active:scale-95 transition-transform"
                  onClick={() => setCurrent((p) => p + 1)}
               />
            )}
         </motion.div>

         <MessageSquareWarning
            className={twMerge(
               'size-7 text-main-border  shrink-0 absolute right-1  transition-transform ',
               !isClosable ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:scale-105 active:scale-95',
            )}
            onClick={() => {
               if (isClosable) {
                  localStorage.setItem('banners_closed', ids)
                  setIsOpen((p) => !p)
               } else alert('You have unread banners. Please read all banners before closing.')
            }}
         />
      </motion.div>
   )
}
