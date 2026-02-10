'use client'
import Image from 'next/image'
import { CombinedSingleSimple } from '@/types/types'
import { Button } from '../../../components/buttons/Buttons'
import { Spotify } from 'react-spotify-embed'
import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Media } from '@/types/yt'
import { applyAlwaysConditions } from '@/utils/spotifySearchConditions'
import AuthorString from './AuthorString'
import Cookies from 'js-cookie'
import YtVideo from '../../../components/embeds/YtVideo'
import SpotifyEmbed from '../../../components/embeds/Spotify'
import { twMerge as tw } from 'tailwind-merge'
import Loading from '../../../components/state/Loading'
import YtSongEmbed from '../../../components/embeds/YtSong'
import { wikiSearchExact, wikiSearchMusicianTitle } from '@/lib/wiki'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWikipediaW } from '@fortawesome/free-brands-svg-icons'
import ExternalLink from '../../../components/ExternalLink'
import useFoStore from '@/contexts/useFoStore'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import CloseBtn from '@/components/buttons/CloseBtn'
// TODO remove queries yt and wiki when 0 info

export default function Info({ data }: { data: CombinedSingleSimple }) {
   const { local, spotify, osu } = data
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
         const song = applyAlwaysConditions(local)
         const { data } = await axios.get(`/api?query=${encodeURIComponent(song.author + ' ' + song.title)}`)
         return data
      },
      enabled: selection == 'youtube',
   })

   // TODO wiki is enabled
   const wikiQuery = useQuery({
      queryKey: ['wiki', local.author],
      queryFn: async () => {
         const { title, url } = await wikiSearchMusicianTitle(local.author)
         if (!title || !url) return null
         const content = await wikiSearchExact(title)
         if (!content) return null
         return { title, url, content }
      },
      enabled: false,
   })

   return (
      <div
         ref={container}
         id="info-card"
         className={tw(
            'relative opacity-95 flex flex-col border-5 border-l-0 rounded-xl rounded-l-none border-main-border p-4  text-white min-w-[600px] max-w-[600px] min-h-[300px] h-[550px]',
            'bg-triangles-faded-right [--color-dialog:var(--color-main)]',
         )}
      >
         <CloseBtn
            onClick={() => useFoStore.setState({ current: null })}
            className="absolute right-2 top-2 visible lgx:invisible "
         />
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
            <div className="flex flex-col justify-between text-ellipsis w-full">
               <div>
                  <h1 className="flex items-end gap-1.5 font-outline-sm">
                     <span className="text-2xl font-semibold">{local.title}</span>
                     {spotify && spotify?.length != 20 && (
                        <span className="text-sm font-medium mb-0.5">{spotify[0].album.release_date.split('-')[0]}</span>
                     )}
                  </h1>
                  <h2 className="font-medium mt-1 line-clamp-2 font-outline-sm text-[15px]/[19px]">
                     {spotify && spotify?.length != 20 && osu ? (
                        <AuthorString artists={spotify[0].artists} beatmapset={osu} />
                     ) : (
                        <span>{osu?.artist}</span>
                     )}
                     {!osu && <span>{local.author}</span>}
                  </h2>
               </div>
               <div className="flex items-end">
                  {spotify && spotify?.length != 20 && spotify[0].album.name != local.title && (
                     <h3 className="font-medium line-clamp-2 hover:underline font-outline-sm flex-grow text-[15px]/[19px]">
                        <a href={spotify[0].album.external_urls.spotify}>{spotify[0].album.name}</a>
                     </h3>
                  )}
                  {wikiQuery.data?.content && (
                     <div className="relative font-outline-sm overflow-hidden h-7.5 w-55 px-1 bg-white/20 rounded-lg flex-grow border-1 border-main-darker/50">
                        <p className="text-[11px]/[11px] line-clamp-2 pr-24 text-justify mt-1 ">{wikiQuery.data?.content}</p>
                        <div className="w-7 h-full absolute bg-gradient-to-r from-transparent to-gray-50 top-1/2 -translate-y-1/2 right-20.5"></div>
                        <a
                           className="absolute top-1/2 -translate-y-1/2 right-0 bg-gray-50 text-black rounded-r-lg h-full flex items-center px-1 font-inter-tight text-xs"
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
            <Button
               onClick={() => setSelection('spotify')}
               disabled={spotify ? false : true}
               className={tw(
                  selection == 'spotify' && 'brightness-85 hover:brightness-100',
                  'p-0 w-[102px] h-[31px] bg-brand-spotify border-2 border-[#159A44]',
               )}
            >
               <Image src="/SpotifyFull.svg" width={83} height={23} alt="spotify" />
            </Button>
            <Button
               onClick={() => setSelection('youtube')}
               disabled={spotify ? false : true}
               className={tw(
                  selection == 'youtube' && 'brightness-85 hover:brightness-100',
                  'p-0 w-[102px] h-[31px] bg-[#FFD7D7] border-2 border-main-lightest ',
               )}
            >
               <Image src="/youtubeFull.svg" width={78} height={17} alt="youtube" />
            </Button>
            <ExternalLink
               href={`https://osu.ppy.sh/beatmapsets/${osu?.id}`}
               className="justify-end flex-1 mr-0.5"
               disabled={!osu}
            >
               Beatmap
            </ExternalLink>
         </div>

         {selection === 'spotify' && (
            <li className="relative scrollbar flex flex-col gap-2 mt-3 bg-main-darker w-full h-full py-2 rounded-lg border-4 border-[#159A44] overflow-auto">
               {spotify?.length == 20 && (
                  <div className="flex gap-2">
                     <span className="text-5xl text-red-500 font-bold">!</span>
                     <span className="text-lg font-semibold">
                        The song wasn&apos;t found through a normal search query, so there could be a ton of useless results
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
            <li className="relative scrollbar flex flex-wrap gap-2 mt-3 bg-main-darker box-border w-full h-full py-2 rounded-lg border-4 border-main-lightest overflow-auto">
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
                     if (media.type === 'SONG') return <YtSongEmbed key={i} song={media} />
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
