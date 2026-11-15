import { getGitHubRepoLastUpdate, getGitHubRepoStarCount } from '@/lib/actions/github'
import { Heart, ExternalLink } from 'lucide-react'
import { FooterShine } from './FooterShine'

export default async function Footer() {
   const lastUpdated = await getGitHubRepoLastUpdate()
   const stargazeCount = await getGitHubRepoStarCount()
   return (
      <footer className="mt-auto pb-3 3xl:pb-4 4xl:pb-5">
         <FooterShine>
            <p className="footer-shine-text text-base 3xl:text-lg 4xl:text-xl 5xl:text-2xl max-sm:text-[13px] px-1 3xl:px-2 text-center">
               Love the app? Leave a star on{' '}
               <a href="https://github.com/yaGeey/osu-find-songs" target="_blank" className="hover:underline">
                  GitHub
               </a>{' '}
               ★ or{' '}
               <a href="https://ko-fi.com/yageey" target="_blank" className="hover:underline">
                  buy me a coffee!
               </a>
            </p>
            <p className="footer-shine-text footer-shine-text--dim text-sm 3xl:text-base 4xl:text-lg 5xl:text-xl max-sm:text-[13px] flex px-2 justify-center items-center gap-5 3xl:gap-8 4xl:gap-10">
               <a
                  href="https://github.com/yaGeey/osu-find-songs"
                  target="_blank"
                  className="hover:underline flex items-center justify-center gap-1"
               >
                  GitHub ★ {stargazeCount || 'xx'} · Last update:{' '}
                  {lastUpdated ? new Date(lastUpdated.date).toLocaleDateString() : 'x/xx/xx'}{' '}
                  <ExternalLink size={13} className="3xl:size-4 4xl:size-5" />
               </a>
               <a
                  href="https://ko-fi.com/yageey"
                  target="_blank"
                  className="hover:underline flex items-center justify-center gap-1"
               >
                  Ko-Fi
                  <Heart size={13} className="3xl:size-4 4xl:size-5" />
               </a>
            </p>
         </FooterShine>
      </footer>
   )
}
