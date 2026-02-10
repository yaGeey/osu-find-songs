'use client'
import React from 'react'
import Modal from './Modal'
import { HandHelping } from 'lucide-react'
import CustomLink from './CustomLink'

export default function SupportIcon({ className }: { className?: string }) {
   const [isOpen, setIsOpen] = React.useState(false)
   const anchorRef = React.useRef<HTMLAnchorElement>(null)
   return (
      <>
         <a ref={anchorRef} href="https://ko-fi.com/yageey" target="_blank" rel="noopener noreferrer" />
         <HandHelping className={className} onClick={() => setIsOpen(true)} />
         <Modal
            isOpen={isOpen}
            setIsOpen={() => setIsOpen(false)}
            title="Help me keep this app alive"
            status="info"
            buttons={[
               {
                  children: 'Donate',
                  onClick: () => {
                     if (anchorRef.current) anchorRef.current.click()
                  },
                  className: 'bg-success',
               },
               { children: 'Close', onClick: () => setIsOpen(false), className: 'bg-transparent text-black' },
            ]}
         >
            <p>
               Spotify recently{' '}
               <CustomLink href="https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security" showIcon className='hover'>
                  updated its rules
               </CustomLink>
               , and now developers must have a Premium subscription to keep the API active... damn corporates. If you enjoy the
               app, have spare dollar or two, and want to support it, consider donating so I can keep the app alive 🙏
            </p>
         </Modal>
      </>
   )
}
