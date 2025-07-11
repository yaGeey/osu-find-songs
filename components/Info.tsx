'use client'
import Image from 'next/image'
import { CombinedSingleSimple } from '@/types/types'
import { YoutubeBtn, SpotifyBtn, OtherBtn, OsuBtn } from './buttons/Buttons'
import { Spotify } from 'react-spotify-embed'
import axios from 'axios'
import { HTMLAttributes, Ref, use, useEffect, useRef, useState } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { Media } from '@/types/yt'
import { applyAlwaysConditions } from '@/utils/conditions'
import AuthorString from './AuthorString'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import Cookies from 'js-cookie'
import YtVideo from './embeds/YtVideo'
import SpotifyEmbed from './embeds/Spotify'
import { twMerge as tw } from 'tailwind-merge'
import Loading from './state/Loading'
import YtSongEmbed from './embeds/YtSong'
import { wikiSearchExact, wikiSearchMusicianTitle } from '@/lib/wiki'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWikipediaW } from '@fortawesome/free-brands-svg-icons'
import ExternalLink from './ExternalLink'
gsap.registerPlugin(useGSAP)
// TODO remove queries yt and wiki when 0 info
interface Props extends HTMLAttributes<HTMLDivElement> {
   data: CombinedSingleSimple
   onClose: () => void
}

export default function Info({ data, onClose, className }: Props) {
   const { spotify, osu, local } = data
   const [selection, setSelection] = useState<'spotify' | 'youtube' | 'other'>('spotify')
   const container = useRef<HTMLDivElement>(null)

   useEffect(() => {
      if (spotify && spotify?.length !== 20) setSelection('spotify')
      else setSelection('youtube')
   }, [spotify || null, osu || null])

   useEffect(() => {
      if (!Cookies.get('showSpotifyEmbeds')) Cookies.set('showSpotifyEmbeds', 'true')
      if (!Cookies.get('showYouTubeEmbeds')) Cookies.set('showYouTubeEmbeds', 'true')
   }, [])

   const yt = useQuery({
      queryKey: ['youtube', local.id],
      queryFn: async (): Promise<Media[]> => {
         let song = applyAlwaysConditions(local)
         const { data } = await axios.get(`/api?query=${encodeURIComponent(song.author + ' ' + song.title)}`)
         return data
      },
      enabled: selection == 'youtube',
   })

   const wikiQuery = useQuery({
      queryKey: ['wiki', local.author],
      queryFn: async () => {
         const { title, url } = await wikiSearchMusicianTitle(local.author)
         if (!title || !url) return null
         const content = await wikiSearchExact(title)
         if (!content) return null
         return { title, url, content }
      },
   })

   return (
      <div
         ref={container}
         id="info-card"
         className={tw(
            'relative opacity-90 animate-in slide-in-from-left flex flex-col border-[5px] border-main-border p-4 rounded-xl text-white min-w-[600px] max-w-[600px] h-[600px]',
            '[background:linear-gradient(transparent,_var(--color-main)_75px,var(--color-main)_100%),url(/osu/tris2.png)_no-repeat_top_right,var(--color-main)]',
            className,
         )}
      >
         <div
            className="absolute top-2 right-2 cursor-pointer w-10 h-10 opacity-100 lgx:opacity-0 transition-all"
            onClick={onClose}
         >
            <Image src="/icons/close.svg" layout="fill" alt="close" />
         </div>
         <div className="flex gap-4 h-[120px]">
            <div className="min-w-[120px] max-w-[120px] h-[120px]">
               <Image
                  src={local.image}
                  width={0}
                  height={0}
                  sizes="100vw"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  alt="cover"
                  className="rounded-md [box-shadow:0px_4px_4px_rgba(0,0,0,0.25)]"
               />
            </div>
            <div className="flex flex-col justify-between text-ellipsis">
               <div>
                  <h1 className="flex items-end gap-1.5 font-outline-sm">
                     <span className="text-2xl font-semibold">{local.title}</span>
                     {spotify && spotify?.length != 20 && (
                        <span className="text-sm font-medium mb-0.5">{spotify[0].album.release_date.split('-')[0]}</span>
                     )}
                  </h1>
                  {/* //TODO ! add links to authors spotify && osu authors search */}
                  <h2 className="text-base font-medium mt-1 line-clamp-2 font-outline-sm text-[15px]">
                     {spotify?.length != 20 && osu ? (
                        <AuthorString artists={spotify[0].artists} beatmapset={osu} />
                     ) : (
                        <span>{osu?.artist}</span>
                     )}
                     {!osu && <span>{local.author}</span>}
                  </h2>
               </div>
               <div className="flex justify-between items-end">
                  {spotify && spotify?.length != 20 && spotify[0].album.name != local.title && (
                     <h3 className="font-medium line-clamp-2 hover:underline font-outline-sm pr-8 text-[15px]">
                        <a href={spotify[0].album.external_urls.spotify}>{spotify[0].album.name}</a>
                     </h3>
                  )}
                  {wikiQuery.data?.content && (
                     <div className="relative font-outline-sm overflow-hidden h-8 w-4/5 px-1 bg-white/20 rounded-lg flex-grow">
                        <p className="text-xs pr-24 text-justify">{wikiQuery.data?.content}</p>
                        <div className="w-7 h-full absolute bg-gradient-to-r from-transparent to-white top-1/2 -translate-y-1/2 right-26"></div>
                        <a
                           className="absolute top-1/2 -translate-y-1/2 right-0 bg-white text-black text-sm rounded-r-lg p-1.5"
                           href={wikiQuery.data?.url}
                           target="_blank"
                        >
                           <FontAwesomeIcon icon={faWikipediaW} className="mr-1" />
                           Read more
                        </a>
                     </div>
                  )}
               </div>
            </div>
         </div>

         <div className="flex w-full items-end gap-4 mt-4 align-s">
            <SpotifyBtn
               onClick={() => setSelection('spotify')}
               disabled={spotify ? false : true}
               className={selection == 'spotify' ? 'selection' : ''}
            />
            <YoutubeBtn onClick={() => setSelection('youtube')} className={selection == 'youtube' ? 'selection' : ''} />
            <ExternalLink
               href={`https://osu.ppy.sh/beatmapsets/${osu?.id}`}
               className="justify-end flex-1 mr-0.5"
               disabled={!osu}
            >
               Beatmap
            </ExternalLink>
         </div>

         {selection === 'spotify' && (
            <li className="relative scrollbar flex flex-col gap-2 mt-3 bg-[#0909094D] box-border w-full h-full p-2 rounded-lg border-[4px] border-[#159A44] overflow-auto">
               {spotify?.length == 20 && (
                  <div className="flex gap-2">
                     <span className="text-5xl text-red-500 font-bold">!</span>
                     <span className="text-lg font-semibold">
                        The song wasn't found through a normal search query, so there could be a ton of useless results
                     </span>
                  </div>
               )}
               {spotify?.map((track, i: number) =>
                  Cookies.get('showSpotifyEmbeds') == 'true' ? (
                     <Spotify wide link={track.external_urls.spotify} key={i} />
                  ) : (
                     <SpotifyEmbed track={track} key={i} />
                  ),
               )}
            </li>
         )}
         {selection === 'youtube' && (
            <li className="relative scrollbar flex flex-wrap gap-2 mt-3 bg-[#0909094D] box-border w-full h-full p-2 rounded-lg border-[4px] border-light overflow-auto">
               {yt.isLoading && <Loading />}
               {yt.data?.map((media: Media, i: number) => {
                  if (Cookies.get('showYouTubeEmbeds') == 'true') {
                     if (media.type === 'VIDEO')
                        return (
                           <iframe
                              key={i}
                              src={`https://www.youtube.com/embed/${media.videoId}`}
                              width="49%"
                              height="140px"
                              allowFullScreen
                           ></iframe>
                        )
                  } else {
                     if (media.type === 'VIDEO') return <YtVideo key={i} data={media} />
                     if (media.type === 'SONG') return <YtSongEmbed key={i} song={media} />
                  }
               })}
            </li>
         )}
      </div>
   )
}
