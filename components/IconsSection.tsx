import { House, Github } from 'lucide-react'
import Link from 'next/link'

export default function IconsSection({ children }: { children?: React.ReactNode }) {
   return (
      <section className="flex items-center gap-3 -mb-1 transition-all opacity-80">
         <HomeIcon className="hover:scale-105 transition-all no-jump size-[30px]" />
         <GithubIcon className="hover:scale-105 transition-all no-jump size-[30px]" />
         {/* <SupportIcon className="size-[30px] cursor-pointer hover:scale-105 transition-transform -ml-3 no-jump" /> */}
         {children}
      </section>
   )
}
export function HomeIcon({ className }: { className?: string }) {
   return (
      <Link href="/">
         <House className={className} />
      </Link>
   )
}
export function GithubIcon({ className }: { className?: string }) {
   return (
      <a href="https://github.com/yaGeey/osu-find-songs" target="_blank" rel="noopener noreferrer">
         <Github className={className} />
      </a>
   )
}
