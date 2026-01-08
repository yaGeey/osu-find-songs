'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { twMerge as tw } from 'tailwind-merge'
import { useParams, useSearchParams } from 'next/navigation'
import OsuCard from './_components/OsuCard'
import { QueryFunctionContext, useInfiniteQuery, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchWithToken, getPlaylist } from '@/lib/Spotify'
import type { PlaylistPage } from '@/types/Spotify'
import HomeBtn from '@/components/buttons/HomeBtn'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { BeatmapSet } from '@/types/Osu'
import OsuCardSet from './_components/OsuCardSet'
import { toast, ToastContainer } from 'react-toastify'
import Filters from './_components/Filters'
import Progress from '@/components/state/Progress'
import BgImage from '@/components/BgImage'
import { sortBeatmapsMatrix } from './_utils/sortBeatmapsMatrix'
import { chunkArray, uniqueBeatmapsetMatrix } from '@/utils/arrayManaging'
import useDownloadAll from '@/hooks/useDownloadAll'
import { faGithub } from '@fortawesome/free-brands-svg-icons'
import useTimeLeft from '@/hooks/useTimeLeft'
import VirtuosoCards from './_components/VirtuosoCards'
import axios from 'axios'
import Loading from '@/components/state/Loading'
import ProgressNotify, { ProgressNotifyHandle } from '@/components/state/ProgressNotify'
import { useMapDownloadStore } from '@/contexts/useMapDownloadStore'
import { filterBeatmapsMatrix } from './_utils/filterBeatmapsMatrix'
import { FS_CHUNK_SIZE, MAPS_AMOUNT_TO_SHOW_VIRTUALIZED } from '@/variables'
import DevLoadingTime from '@/components/DevLoadingTime'
import DownloadAllBtn from './_components/DownloadAllBtn'
import ProgressMapDownload from './_components/ProgressMapDownload'
import { SelectedOption } from '@/components/selectors/FilterOptions'
import Image from 'next/image'
import { CardRenderer } from './_components/CardRenderer'

export default function PlaylistPage() {
   const params = useParams()
   const searchParams = useSearchParams()
   const { playlistId } = params
   const [error, setError] = useState<string>('')
   const notiryErrRef = useRef<ProgressNotifyHandle | null>(null)

   // download progress
   const progressNotifyRef = useRef<ProgressNotifyHandle | null>(null)
   const { setProgressBlinkRef } = useMapDownloadStore()
   useEffect(() => {
      setProgressBlinkRef(progressNotifyRef)
   }, [setProgressBlinkRef, progressNotifyRef])

   // remove scrollbar
   useEffect(() => {
      document.body.style.overflow = 'hidden'
      return () => {
         document.body.style.overflow = ''
      }
   }, [])

   // const [beatmapsets, setBeatmapsets] = useState<BeatmapSet[][]>([])
   const [filters, setFilters] = useState<SelectedOption[]>([])
   const [searchQuery, setSearchQuery] = useState('')
   const [spotifyTotal, setSpotifyTotal] = useState<number>(0)

   const { data: playlistInfo, isFetching: playlistLoading } = useQuery({
      queryKey: ['spotify-playlist-info', playlistId],
      queryFn: async () => getPlaylist(playlistId as string),
   })

   // fetching playlist
   const {
      data: tracksData,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
      isFetching: isTracksLoading,
   } = useInfiniteQuery({
      queryKey: ['spotify-playlist', playlistId], //? idk why but this cause endless fetching on first page load, so...
      queryFn: async ({ pageParam = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=0&limit=100` }) =>
         await fetchWithToken(pageParam),
      getNextPageParam: (lastPage) => {
         if (!spotifyTotal) setSpotifyTotal(lastPage.total)
         return lastPage.next ? lastPage.next : undefined
      },
      getPreviousPageParam: (firstPage) => (firstPage.previous ? firstPage.previous : undefined),
      initialPageParam: `https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=0&limit=100`,
      retry: 0,
   })
   useEffect(() => {
      if (hasNextPage && !isFetchingNextPage) fetchNextPage()
   }, [hasNextPage, isFetchingNextPage, fetchNextPage])

   const tracks = tracksData?.pages.map((page: PlaylistPage) => page.items).flat() || []
   const isTracksLoadingFinal = isFetchingNextPage || hasNextPage || isTracksLoading || tracks.length < spotifyTotal

   // beatmapset search
   const chunked = chunkArray(tracks, FS_CHUNK_SIZE)
   const beatmapsetQueries = useQueries({
      queries: chunked.map((chunk) => ({
         queryKey: ['search-from-spotify', chunk?.[0]?.track?.id ?? 'err'],
         queryFn: async ({ signal }: QueryFunctionContext) => {
            const t0 = performance.now()
            // if (!item.track) return [] //? odd error rarely occurs
            const body = {
               qs: chunk.map(
                  (item) => `artist=${item.track.artists[0].name} title=${item.track.name} ${searchParams.get('q') || ''}`,
               ),
               m: searchParams.get('m'),
               // s: searchParams.get('s'),
               s: 'any',
            }

            try {
               const { data } = await axios.post<(BeatmapSet[] | null)[]>('/api/batch/osu-search', body, { signal })
               addTimeLeft(performance.now() - t0)
               return data
            } catch (err: any) {
               if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') throw new Error('canceled')
               notiryErrRef.current?.blink(4000)
               throw err
            }
         },
         enabled: !!tracks,
      })),
   })

   const initialLoading = !playlistInfo
   const isLoading = beatmapsetQueries.some((q) => q.isFetching) || isTracksLoadingFinal || playlistLoading
   const { addTimeLeft, timeLeft, msLeft } = useTimeLeft(beatmapsetQueries.filter((q) => !q.isFetched).length)

   // full data
   const mapsFlatten = beatmapsetQueries
      .map((q) => q.data)
      .flat()
      .filter((item) => item != null)
   const mapsFetched = mapsFlatten.length

   // prepara data for display
   const maps = useMemo(() => {
      const status = searchParams.get('s')
      const mode = searchParams.get('m')
      const modeMapped = { '0': 'osu', '1': 'taiko', '2': 'fruits', '3': 'mania' }[mode || '']
      const queryLower = searchQuery.toLowerCase().trim()

      const filtered = filterBeatmapsMatrix(mapsFlatten, filters)
         .map((set) =>
            set.filter((map) => {
               const isStatusMatch = status
                  ? status === 'any'
                     ? true
                     : map.status === status
                  : ['ranked', 'approved', 'loved', 'qualified'].includes(map.status)

               const isModeMatch = modeMapped ? map.beatmaps.some((b) => b.mode === modeMapped) : true

               const isSearchMatch = !queryLower
                  ? true
                  : map.artist.toLowerCase().includes(queryLower) ||
                    map.title.toLowerCase().includes(queryLower) ||
                    map.creator.toLowerCase().includes(queryLower)

               return isStatusMatch && isModeMatch && isSearchMatch
            }),
         )
         .filter((set) => set.length > 0)

      return uniqueBeatmapsetMatrix(filtered).sort((a, b) =>
         sortBeatmapsMatrix(a, b, searchParams.get('sort') || 'relevance_asc'),
      )
   }, [searchParams, mapsFlatten, filters, searchQuery])

   const { text, progress, handleDownloadAll } = useDownloadAll(maps, searchParams.get('sort') || 'relevance_asc')

   // Handle errors
   useEffect(() => {
      if (beatmapsetQueries.some((q) => q.isError)) {
         const errorMsg = beatmapsetQueries.find((q) => q.isError)?.error?.message || 'An error occurred while fetching beatmaps.'
         setError(errorMsg)
         notiryErrRef.current?.blink(4000)
      }
   }, [beatmapsetQueries])

   useEffect(() => {
      if (progress === -1) setError('An error occurred during the download process.')
   }, [progress])

   return (
      <div className="min-w-[710px] font-inter overflow-hidden">
         <DevLoadingTime isLoading={isLoading} dataLength={maps.length} />
         <BgImage className="brightness-[.75]" />

         <Progress isVisible={isLoading} value={spotifyTotal > 0 ? Math.min((mapsFetched / spotifyTotal) * 100, 100) : 0}>
            {msLeft > 5000 && (
               <span>
                  {mapsFetched}/{spotifyTotal} | {timeLeft} left
               </span>
            )}
         </Progress>
         <Progress isVisible={progress !== null} value={progress || 0} color="text-success">
            {text}
         </Progress>
         <ProgressNotify ref={progressNotifyRef} color="text-success" />
         <ProgressMapDownload />
         <ProgressNotify ref={notiryErrRef} color="text-error" textBgColor="bg-error">
            {error}
         </ProgressNotify>

         <header
            className={tw(
               'min-w-[710px] bg-triangles [--color-dialog:var(--color-main])] fixed z-100 w-screen h-12 flex justify-between items-center px-4 gap-10 border-b-3 border-main-darker',
            )}
         >
            <section className="flex items-center gap-4">
               <HomeBtn />
               <a href="https://github.com/yaGeey/osu-find-songs" target="_blank" rel="noopener noreferrer">
                  <FontAwesomeIcon icon={faGithub} className="text-3xl -mb-1 hover:scale-105 transition-transform" />
               </a>
            </section>
            {playlistInfo?.name && (
               <p className="absolute left-1/2 -translate-x-1/2 font-semibold text-main-gray bg-main/40 px-3 py-1 rounded-md max-w-[30%] w-full min-w-fit text-center overflow-hidden text-ellipsis">
                  <span className={tw(isLoading && 'animate-pulse')}>{playlistInfo?.name}</span>
               </p>
            )}
            <div className="_invisible">
               <DownloadAllBtn disabled={isLoading} maps={maps} progress={progress} handleDownloadAll={handleDownloadAll} />
            </div>
         </header>

         <main className="flex justify-center mt-12">
            <div className="relative h-[calc(100dvh-3rem)] w-full max-w-[980px] min-w-[710px] bg-main-darker">
               <div className="relative [background:url(/osu/tris-l-t.svg)_no-repeat,url(/osu/tris-r.svg)_no-repeat_bottom_right,var(--color-main-dark)] z-110 w-full px-5 py-2 text-white shadow-tight text-nowrap border-b-2 border-b-main-border">
                  {maps.length > 0 && (
                     <Image
                        src={maps[0][0]?.covers.slimcover}
                        alt="bg"
                        fill
                        className="object-cover opacity-5 pointer-events-none"
                        sizes="100vw"
                     />
                  )}
                  <Filters
                     foundString={Array.isArray(maps) && maps.length ? `${maps.length}/${tracks.length} found` : ''}
                     disabled={isLoading}
                     onFilterChange={setFilters}
                     onSearch={setSearchQuery}
                  />
               </div>

               {!isLoading && maps.length < MAPS_AMOUNT_TO_SHOW_VIRTUALIZED ? (
                  <div className="grid grid-cols-1 [@media(min-width:810px)]:grid-cols-2 gap-2.5 p-2.5 bg-main-darker overflow-y-auto max-h-[calc(100dvh-48px-156px)] scrollbar">
                     {maps.map((data, i) => (
                        <CardRenderer
                           key={data[0].id}
                           data={data}
                           sortQuery={searchParams.get('sort') || 'relevance_asc'}
                           className="animate-in fade-in duration-200"
                        />
                     ))}
                  </div>
               ) : (
                  <VirtuosoCards maps={maps} sortQuery={searchParams.get('sort') || 'relevance_asc'} />
               )}
               {!isLoading && !initialLoading && !maps.length && (
                  <div className="text-black/40 text-2xl h-full w-full text-center mt-10 animate-in fade-in">
                     No results found
                     <p className="text-base">Try setting the state to &apos;any&apos; to see unranked maps</p>
                  </div>
               )}
               {isLoading && <Loading className="top-39 h-[calc(100%-9.75rem)]" radius={50} />}
            </div>
         </main>
         <ToastContainer />
      </div>
   )
}
