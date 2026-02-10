import { House, Github } from 'lucide-react'
import React from 'react'
import SupportIcon from './SupportIcon'
import Link from 'next/link'

export default function IconsSection() {
   return (
      <section className="flex items-center gap-3 -mb-1 transition-all opacity-80">
         <Link href="/">
            <House className="hover:scale-105 transition-all no-jump size-[30px]" />
         </Link>
         <a href="https://github.com/yaGeey/osu-find-songs" target="_blank" rel="noopener noreferrer">
            <Github className="hover:scale-105 transition-all no-jump size-[30px]" />
         </a>
         <SupportIcon className="size-[30px] cursor-pointer hover:scale-105 transition-transform -ml-3 no-jump" />
      </section>
   )
}
