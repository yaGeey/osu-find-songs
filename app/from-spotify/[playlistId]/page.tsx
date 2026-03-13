'use client'
import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { twMerge as tw } from 'tailwind-merge'
import { useParams, useSearchParams } from 'next/navigation'
import { QueryFunctionContext, useInfiniteQuery, useQueries, useQuery } from '@tanstack/react-query'
import { BeatmapSet } from '@/types/Osu'
import { ToastContainer } from 'react-toastify'
import Filters from './_components/Filters'
import Progress from '@/components/state/Progress'
import { sortBeatmapsMatrix } from './_utils/sortBeatmapsMatrix'
import { chunkArray, uniqueBeatmapsetMatrix } from '@/utils/arrayManaging'
import useDownloadAll from '@/lib/osu/useDownloadAll'
import useTimeLeft from '@/hooks/useTimeLeft'
import VirtuosoCards from './_components/VirtuosoCards'
import Loading from '@/components/state/Loading'
import ProgressNotify from '@/components/state/ProgressNotify'
import { filterBeatmapsMatrix } from './_utils/filterBeatmapsMatrix'
import { FS_CHUNK_SIZE, MAPS_AMOUNT_TO_SHOW_VIRTUALIZED } from '@/variables'
import DevLoadingTime from '@/components/DevLoadingTime'
import DownloadAllBtn from './_components/DownloadAllBtn'
import ProgressMapDownload from './_components/ProgressMapDownload'
import { SelectedOption } from '@/components/selectors/FilterOptions'
import Image from 'next/image'
import { CardRenderer } from './_components/CardRenderer'
import CustomLink from '@/components/CustomLink'
import { AnimatePresence, motion, stagger, useAnimate } from 'framer-motion'
import IconsSection from '@/components/IconsSection'
import { getPlaylistMetadata, getPlaylistPage } from '@/lib/spotify/innerApi'
import clientAxios from '@/lib/client-axios'
import useBaseStore from '@/contexts/useBaseStore'

export default function PlaylistPage() {
   const params = useParams()
   const searchParams = useSearchParams()
   const { playlistId } = params
   const progressNotifyRef = useBaseStore((state) => state.progressNotifyRef)

   // remove scrollbar
   useEffect(() => {
      document.body.style.overflow = 'hidden'
      return () => {
         document.body.style.overflow = ''
      }
   }, [])

   const [filters, setFilters] = useState<SelectedOption[]>([])
   const [searchQuery, setSearchQuery] = useState('')

   const { data: playlistInfo, isFetching: playlistLoading } = useQuery({
      queryKey: ['spotify-playlist-info', playlistId],
      queryFn: async () => getPlaylistMetadata(playlistId as string),
   })

   // fetching playlist
   //TODO keep in mind - 800+600 ms delay (change it)
   const {
      data,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
      isFetching: isTracksFetching,
   } = useInfiniteQuery({
      queryKey: ['spotify-playlist', playlistId],
      queryFn: async ({ pageParam = 0 }) => {
         if (pageParam !== 0) {
            const delay = Math.floor(Math.random() * 600) + 800
            await new Promise((r) => setTimeout(r, delay))
         }
         return await getPlaylistPage(playlistId as string, pageParam)
      },
      getNextPageParam: (lastPage) => lastPage.nextOffset,
      initialPageParam: 0,
      retry: 0,
   })

   // continue fetching
   useEffect(() => {
      if (hasNextPage && !isFetchingNextPage) fetchNextPage()
   }, [hasNextPage, isFetchingNextPage, fetchNextPage])

   const tracks = data?.pages.flatMap((page) => page.items.map((i) => i.itemV2.data)) || []
   const spotifyTotal = data?.pages?.[0]?.total || 0
   const isTracksLoadingFinal = isFetchingNextPage || hasNextPage || isTracksFetching || tracks.length < spotifyTotal

   // beatmapset search
   const chunked = chunkArray(tracks, FS_CHUNK_SIZE)
   const beatmapsetQueries = useQueries({
      queries: chunked.map((chunk) => ({
         queryKey: ['search-from-spotify', chunk?.[0]?.uri?.split(':').at(-1) ?? 'err'],
         queryFn: async ({ signal }: QueryFunctionContext) => {
            const t0 = performance.now()
            const body = {
               qs: chunk
                  .map((item) => {
                     if (!item) return
                     const artistName = item.artists?.items?.[0]?.profile?.name
                     if (!artistName) return //? sometimes no items in artists, idk why
                     return `artist=${artistName} title=${item.name} ${searchParams.get('q') || ''}}`
                  })
                  .filter(Boolean),
               m: searchParams.get('m'),
               // s: searchParams.get('s'),
               s: 'any',
            }

            const { data } = await clientAxios.post<(BeatmapSet[] | null)[]>('/api/batch/osu-search', body, { signal })
            addTimeLeft(performance.now() - t0)
            return data
         },
         enabled: !!tracks,
      })),
   })

   const initialLoading = !playlistInfo
   const isLoading = beatmapsetQueries.some((q) => q.isFetching) || playlistLoading || isTracksLoadingFinal
   const { addTimeLeft, timeLeft, msLeft } = useTimeLeft(beatmapsetQueries.filter((q) => !q.isFetched).length)

   // full data
   const mapsFlatten = useMemo(() => {
      return beatmapsetQueries
         .map((q) => q.data)
         .flat()
         .filter((item) => item != null)
   }, [beatmapsetQueries.map((q) => q.data).join(',')])
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
         progressNotifyRef?.current?.blink('error', 4000, errorMsg)
      }
   }, [beatmapsetQueries.map((q) => q.isError).join(',')])

   useEffect(() => {
      if (progress === -1) progressNotifyRef?.current?.blink('error', 4000, 'An error occurred during the download process.')
   }, [progress])

   // animation
   const [scope, animate] = useAnimate()
   // We use useLayoutEffect instead of useEffect to prevent visual flickering.
   // It fires synchronously after DOM mutations but BEFORE the browser paints,
   // ensuring the initial animation state (opacity: 0) is applied before the user sees the elements.
   useLayoutEffect(() => {
      if (!scope.current) return
      if (!maps.length) return
      animate(
         'li',
         { opacity: [0, 1], y: [8, 0], scale: [0.96, 1] },
         {
            delay: stagger(0.03, { ease: 'easeOut' }),
            type: 'spring',
            duration: 0.5,
            bounce: 0.3,
         },
      )
   }, [maps, animate, scope])

   const sortQuery = searchParams.get('sort') || 'relevance_asc'
   const renderedGrid = useMemo(() => {
      return maps.map((data, i) => (
         <li key={data[0].id} className="opacity-0">
            <CardRenderer data={data} sortQuery={sortQuery} />
         </li>
      ))
   }, [maps, sortQuery])

   return (
      <div className="min-w-[710px] font-inter overflow-hidden" translate="no">
         <DevLoadingTime isLoading={isLoading} dataLength={maps.length} />
         <style>{`
         body {
            --bg-brightness: .25;
         }
         `}</style>

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
         <ProgressNotify ref={progressNotifyRef} />
         <ProgressMapDownload />

         <header
            className={tw(
               'min-w-[710px] bg-triangles [--color-dialog:var(--color-main])] fixed z-100 w-screen h-12 flex justify-between items-center px-4 gap-10 border-b-3 border-main-darker',
            )}
         >
            <IconsSection />
            <AnimatePresence>
               {playlistInfo?.name && (
                  <motion.p
                     initial={{ opacity: 0, y: 10, scale: 0.95 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     className="absolute left-1/2 -translate-x-1/2 font-semibold text-main-gray bg-main/40 px-3 py-1 rounded-md max-w-[30%] w-full min-w-fit text-center overflow-hidden text-ellipsis"
                  >
                     <CustomLink
                        href={`https://open.spotify.com/playlist/${playlistId}`}
                        className={tw(
                           isLoading && 'animate-pulse ease-[cubic-bezier(0.4,0,0.6,1)] duration-1500',
                           'hover:text-main-gray focus:text-main-gray after:bg-main-gray/80 text-[18px]',
                        )}
                        lowUnderline
                     >
                        {playlistInfo?.name}
                     </CustomLink>
                  </motion.p>
               )}
            </AnimatePresence>
            <div className="_invisible">
               <DownloadAllBtn
                  disabled={isLoading}
                  maps={maps}
                  progress={progress}
                  handleDownloadAll={handleDownloadAll}
                  loadingText={text}
               />
            </div>
         </header>

         <main className="flex justify-center mt-12">
            <div className="relative h-[calc(100dvh-3rem)] w-full max-w-[980px] min-w-[710px] bg-main-darker">
               <div className="relative [background:url(/osu/tris-l-t.svg)_no-repeat,url(/osu/tris-r.svg)_no-repeat_bottom_right,var(--color-main-dark)] w-full px-5 py-2 text-white [box-shadow:0px_4px_4px_rgba(0,0,0,0.2)] text-nowrap border-b-2 border-b-main-border">
                  <AnimatePresence mode="popLayout">
                     {maps.length > 0 && (
                        <motion.div
                           key={maps[0][0]?.covers.slimcover}
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           exit={{ opacity: 0 }}
                           transition={{ duration: 0.1 }}
                        >
                           <Image
                              src={maps[0][0]?.covers.slimcover}
                              alt="bg"
                              fill
                              className="object-cover opacity-5 pointer-events-none"
                              sizes="100vw"
                              priority
                           />
                           {/* <div className="mix-blend-multiply halftone w-full h-full absolute top-0 left-0 pointer-events-none overflow-hidden opacity-3">
                              <Image
                                 src={maps[0][0]?.covers.slimcover}
                                 alt="bg"
                                 fill
                                 className="object-cover opacity-100 pointer-events-none"
                                 sizes="100vw"
                              />
                           </div> */}
                        </motion.div>
                     )}
                  </AnimatePresence>
                  <Filters
                     foundString={Array.isArray(maps) && maps.length ? `${maps.length}/${tracks.length} found` : ''}
                     disabled={isLoading}
                     onFilterChange={setFilters}
                     onSearch={setSearchQuery}
                  />
               </div>

               {!isLoading && maps.length < MAPS_AMOUNT_TO_SHOW_VIRTUALIZED ? (
                  <div
                     ref={scope}
                     className="list-none grid grid-cols-1 [@media(min-width:810px)]:grid-cols-2 gap-2.5 pt-2.5 pb-3.5 px-[5px] overflow-y-auto max-h-[calc(100dvh-48px-156px)] scrollbar"
                  >
                     {renderedGrid}
                  </div>
               ) : (
                  <VirtuosoCards maps={maps} sortQuery={searchParams.get('sort') || 'relevance_asc'} />
               )}
               {!isLoading && !initialLoading && !maps.length && (
                  <div className="no-jump text-black/40 text-2xl h-full w-full text-center mt-10 animate-in fade-in">
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
