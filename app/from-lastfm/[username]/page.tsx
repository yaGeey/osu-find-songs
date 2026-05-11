'use client'

import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { twMerge as tw } from 'tailwind-merge'
import { useParams, useSearchParams } from 'next/navigation'
import { QueryFunctionContext, useInfiniteQuery, useQueries } from '@tanstack/react-query'
import { BeatmapSet } from '@/types/Osu'
import { ToastContainer } from 'react-toastify'
import Filters from './_components/Filters'
import Progress from '@/components/state/Progress'
import { sortBeatmapsMatrix } from './_utils/sortBeatmapsMatrix'
import { chunkArray, uniqueBeatmapsetMatrix } from '@/utils/arrayManaging'
import useDownloadAll from '@/lib/osu/hooks/useDownloadAll'
import useTimeLeft from '@/hooks/useTimeLeft'
import VirtuosoCards from './_components/VirtuosoCards'
import Loading from '@/components/state/Loading'
import ProgressNotify from '@/components/state/ProgressNotify'
import { filterBeatmapsMatrix } from './_utils/filterBeatmapsMatrix'
import { LASTFM_CHUNK_SIZE, MAPS_AMOUNT_TO_SHOW_VIRTUALIZED } from '@/variables'
import DownloadAllBtn from './_components/DownloadAllBtn'
import ProgressMapDownload from './_components/ProgressMapDownload'
import { SelectedOption } from '@/components/selectors/FilterOptions'
import Image from 'next/image'
import { CardRenderer } from './_components/CardRenderer'
import CustomLink from '@/components/CustomLink'
import { AnimatePresence, motion, stagger, useAnimate } from 'framer-motion'
import IconsSection from '@/components/IconsSection'
import clientAxios from '@/lib/clientAxios'
import useBaseStore from '@/contexts/useBaseStore'
import { getLastfmTopTracks } from '@/lib/lastfm/actions'
import { LastfmBeatmapSet, LastfmPeriod } from '@/types/lastfm'
import { Button } from '@/components/buttons/Buttons'

const periodLabels: Record<LastfmPeriod, string> = {
   overall: 'overall',
   '7day': '7 days',
   '1month': '1 month',
   '3month': '3 months',
   '6month': '6 months',
   '12month': '12 months',
}

const INITIAL_LASTFM_LIMIT = 100
const LOAD_MORE_LASTFM_LIMIT = 50

export default function LastfmPage() {
   const params = useParams<{ username: string }>()
   const searchParams = useSearchParams()
   const username = decodeURIComponent(params.username)
   const period = (searchParams.get('period') || 'overall') as LastfmPeriod
   const progressNotifyRef = useBaseStore((state) => state.progressNotifyRef)
   const [hasMounted, setHasMounted] = useState(false)

   useEffect(() => {
      const frame = requestAnimationFrame(() => setHasMounted(true))
      document.body.style.overflow = 'hidden'
      return () => {
         cancelAnimationFrame(frame)
         document.body.style.overflow = ''
      }
   }, [])

   const [filters, setFilters] = useState<SelectedOption[]>([])
   const [searchQuery, setSearchQuery] = useState('')

   const {
      data: lastfmData,
      isFetching: isLastfmFetching,
      isFetchingNextPage,
      fetchNextPage,
      hasNextPage,
      isError: isLastfmError,
      error: lastfmError,
   } = useInfiniteQuery({
      queryKey: ['lastfm-top-tracks-infinite', username, period],
      initialPageParam: 1,
      queryFn: ({ pageParam }) =>
         getLastfmTopTracks({
            username,
            period,
            page: pageParam,
            limit: pageParam === 1 ? INITIAL_LASTFM_LIMIT : LOAD_MORE_LASTFM_LIMIT,
         }),
      getNextPageParam: (lastPage) => {
         if (!lastPage.hasMore) return undefined
         return lastPage.page === 1 ? 3 : lastPage.page + 1
      },
      retry: 0,
   })

   const lastfmPages = lastfmData?.pages || []
   const firstLastfmPage = lastfmPages[0]
   const expectedLastfmError = firstLastfmPage?.error ?? null
   const tracks = useMemo(() => lastfmPages.flatMap((page) => page.tracks), [lastfmPages])
   const chunked = chunkArray(tracks, LASTFM_CHUNK_SIZE)
   const { addTimeLeft, timeLeft, msLeft } = useTimeLeft(chunked.length)

   const beatmapsetQueries = useQueries({
      queries: chunked.map((chunk) => ({
         queryKey: [
            'search-from-lastfm',
            username,
            period,
            chunk[0]?.rank ?? 'empty',
            chunk.at(-1)?.rank ?? 'empty',
            searchParams.get('q') || '',
         ],
         queryFn: async ({ signal }: QueryFunctionContext) => {
            const t0 = performance.now()
            const body = {
               qs: chunk.map((track) => `artist=${track.artist} title=${track.name} ${searchParams.get('q') || ''}`),
               m: searchParams.get('m'),
               s: 'any',
            }

            const { data } = await clientAxios
               .post<(BeatmapSet[] | null)[]>('/api/batch/osu-search', body, {
                  signal,
                  context: 'search from lastfm',
               })
               .catch((err) => (err.response?.status === 404 ? { data: [] } : Promise.reject(err)))

            addTimeLeft(performance.now() - t0)
            return data.map((set, index) => {
               const track = chunk[index]
               if (!set || !track) return null
               return set.map((beatmapset) => ({
                  ...beatmapset,
                  lastfmRank: track.rank,
                  lastfmTrack: track,
               }))
            })
         },
         enabled: tracks.length > 0,
      })),
   })

   const isSearchingBeatmaps = beatmapsetQueries.some((q) => q.isFetching)
   const completedBeatmapQueries = beatmapsetQueries.filter((q) => q.isSuccess || q.isError).length
   const hasLastfmTracks = tracks.length > 0
   const hasBeatmapSearchChunks = chunked.length > 0
   const hasFinishedInitialBeatmapSearch =
      !hasLastfmTracks || (hasBeatmapSearchChunks && completedBeatmapQueries >= chunked.length)
   const isInitialBeatmapSearchPending =
      hasLastfmTracks && hasBeatmapSearchChunks && !hasFinishedInitialBeatmapSearch
   const isLoading = isLastfmFetching || isSearchingBeatmaps
   const visibleTracks = hasMounted ? tracks : []
   const visibleFirstLastfmPage = hasMounted ? firstLastfmPage : undefined
   const isInitialLastfmLoading = !firstLastfmPage && isLastfmFetching
   const isInitialLoading = !hasMounted || isInitialLastfmLoading || isInitialBeatmapSearchPending
   const canLoadMore = Boolean(hasMounted && hasNextPage && !isLoading && !isLastfmError && !expectedLastfmError)

   const mapsFlatten = beatmapsetQueries
      .map((q) => q.data)
      .flat()
      .filter((item): item is LastfmBeatmapSet[] => item != null)
   const mapsFetched = mapsFlatten.length

   const maps = useMemo(() => {
      const status = searchParams.get('s') || 'any'
      const mode = searchParams.get('m')
      const modeMapped = { '0': 'osu', '1': 'taiko', '2': 'fruits', '3': 'mania' }[mode || '']
      const queryLower = searchQuery.toLowerCase().trim()

      const filtered = filterBeatmapsMatrix(mapsFlatten, filters)
         .map((set) =>
            set.filter((map) => {
               const isStatusMatch = status
                  ? status === 'any'
                     ? true
                     : status === 'leaderboard'
                       ? ['ranked', 'approved', 'loved', 'qualified'].includes(map.status)
                       : map.status === status
                  : ['ranked', 'approved', 'loved', 'qualified'].includes(map.status)

               const isModeMatch = modeMapped ? map.beatmaps.some((b) => b.mode === modeMapped) : true

               const isSearchMatch = !queryLower
                  ? true
                  : map.artist.toLowerCase().includes(queryLower) ||
                    map.title.toLowerCase().includes(queryLower) ||
                    map.creator.toLowerCase().includes(queryLower) ||
                    map.lastfmTrack.name.toLowerCase().includes(queryLower) ||
                    map.lastfmTrack.artist.toLowerCase().includes(queryLower)

               return isStatusMatch && isModeMatch && isSearchMatch
            }),
         )
         .filter((set) => set.length > 0)

      return uniqueBeatmapsetMatrix(filtered).sort((a, b) =>
         sortBeatmapsMatrix(a, b, searchParams.get('sort') || 'lastfm rank_asc'),
      )
   }, [searchParams, mapsFlatten, filters, searchQuery])

   const visibleMaps = hasMounted ? maps : []
   const { text, progress, handleDownloadAll } = useDownloadAll(visibleMaps, searchParams.get('sort') || 'lastfm rank_asc')

   useEffect(() => {
      if (isLastfmError) {
         progressNotifyRef?.current?.blink('error', 5000, lastfmError.message)
      }
   }, [isLastfmError, lastfmError, progressNotifyRef])

   useEffect(() => {
      if (expectedLastfmError) {
         progressNotifyRef?.current?.blink('error', 5000, expectedLastfmError)
      }
   }, [expectedLastfmError, progressNotifyRef])

   useEffect(() => {
      if (beatmapsetQueries.some((q) => q.isError)) {
         const errorMsg = beatmapsetQueries.find((q) => q.isError)?.error?.message || 'An error occurred while fetching beatmaps.'
         progressNotifyRef?.current?.blink('error', 4000, errorMsg)
      }
   }, [beatmapsetQueries.map((q) => q.isError).join(','), progressNotifyRef])

   useEffect(() => {
      if (progress === -1) progressNotifyRef?.current?.blink('error', 4000, 'An error occurred during the download process.')
   }, [progress, progressNotifyRef])

   const [scope, animate] = useAnimate()
   useLayoutEffect(() => {
      if (!scope.current) return
      if (!visibleMaps.length) return
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
   }, [visibleMaps, animate, scope])

   const sortQuery = searchParams.get('sort') || 'lastfm rank_asc'
   const renderedGrid = useMemo(() => {
      return visibleMaps.map((data) => (
         <li key={`${data[0].lastfmRank}-${data[0].id}`} className="opacity-0">
            <CardRenderer data={data} sortQuery={sortQuery} />
         </li>
      ))
   }, [visibleMaps, sortQuery])

   const loadMoreFooter = (
      <div className="flex flex-col items-center gap-2 px-3 py-5 text-center text-sm text-white/70">
         {visibleFirstLastfmPage && (
            <span>
               {visibleTracks.length}
               {visibleFirstLastfmPage.total ? `/${visibleFirstLastfmPage.total}` : ''} Last.fm tracks loaded
            </span>
         )}
         {hasMounted && hasNextPage ? (
            <Button
               type="button"
               onClick={() => void fetchNextPage()}
               disabled={!canLoadMore}
               className="min-w-38"
               textClassName="font-outline-sm"
            >
               {isFetchingNextPage ? 'Loading...' : 'Load more'}
            </Button>
         ) : (
            visibleFirstLastfmPage && visibleTracks.length > 0 && <span>No more Last.fm tracks for this period</span>
         )}
      </div>
   )

   return (
      <div className="min-w-[710px] overflow-hidden" translate="no">
         <style>{`
         body {
            --bg-brightness: .25;
         }
         `}</style>

         <Progress
            isVisible={hasMounted && isLoading}
            value={chunked.length > 0 ? Math.min((completedBeatmapQueries / chunked.length) * 100, 100) : 0}
         >
            {hasLastfmTracks && msLeft > 5000 && (
               <span>
                  {completedBeatmapQueries}/{chunked.length} osu! batches | {timeLeft} left
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
               {visibleFirstLastfmPage?.user && (
                  <motion.p
                     initial={{ opacity: 0, y: 10, scale: 0.95 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     className="absolute left-1/2 -translate-x-1/2 font-semibold text-main-gray bg-main/40 px-3 py-1 rounded-md max-w-[36%] w-full min-w-fit text-center overflow-hidden text-ellipsis"
                  >
                     <CustomLink
                        href={visibleFirstLastfmPage.user.url}
                        className={tw(
                           isLoading && 'animate-pulse ease-[cubic-bezier(0.4,0,0.6,1)] duration-1500',
                           'hover:text-main-gray focus:text-main-gray after:bg-main-gray/80 text-[18px]',
                        )}
                        lowUnderline
                     >
                        {visibleFirstLastfmPage.user.displayName} - {periodLabels[visibleFirstLastfmPage.period]}
                     </CustomLink>
                  </motion.p>
               )}
            </AnimatePresence>
            <div className="_invisible">
               <DownloadAllBtn
                  disabled={!hasMounted || isLoading || !visibleMaps.length}
                  maps={visibleMaps}
                  progress={progress}
                  handleDownloadAll={handleDownloadAll}
                  loadingText={text}
               />
            </div>
         </header>

         <main className="flex justify-center mt-12 h-[calc(100dvh-3rem)]">
            <div className="relative flex h-full w-full max-w-[980px] min-w-[710px] flex-col bg-main-darker">
               <div className="relative shrink-0 [background:url(/osu/tris-l-t.svg)_no-repeat,url(/osu/tris-r.svg)_no-repeat_bottom_right,var(--color-main-dark)] w-full px-5 py-2 text-white [box-shadow:0px_4px_4px_rgba(0,0,0,0.2)] border-b-2 border-b-main-border">
                  <AnimatePresence mode="popLayout">
                     {hasMounted && visibleMaps.length > 0 && (
                        <motion.div
                           key={visibleMaps[0][0]?.covers.slimcover}
                           className="absolute inset-0"
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           exit={{ opacity: 0 }}
                           transition={{ duration: 0.1 }}
                        >
                           <Image
                              src={visibleMaps[0][0]?.covers.slimcover}
                              alt="bg"
                              fill
                              className="object-cover opacity-5 pointer-events-none"
                              sizes="(max-width: 980px) 100vw, 980px"
                              priority
                           />
                        </motion.div>
                     )}
                  </AnimatePresence>
                  <Filters
                     foundString={visibleTracks.length ? `${visibleMaps.length} beatmap matches · ${visibleTracks.length} Last.fm tracks loaded` : ''}
                     disabled={isLoading}
                     onFilterChange={setFilters}
                     onSearch={setSearchQuery}
                  />
               </div>

               {!isInitialLoading && visibleMaps.length < MAPS_AMOUNT_TO_SHOW_VIRTUALIZED ? (
                  <div
                     ref={scope}
                     className="list-none grid min-h-0 flex-1 grid-cols-1 content-start [@media(min-width:810px)]:grid-cols-2 gap-2.5 overflow-y-auto px-[5px] pt-2.5 scrollbar"
                  >
                     {renderedGrid}
                     <div className="[@media(min-width:810px)]:col-span-2">{loadMoreFooter}</div>
                  </div>
               ) : (
                  <div className="min-h-0 flex-1">
                     <VirtuosoCards maps={visibleMaps} sortQuery={sortQuery} footer={loadMoreFooter} />
                  </div>
               )}
               {hasMounted && !isInitialLoading && hasFinishedInitialBeatmapSearch && !visibleMaps.length && (
                  <div className="no-jump text-black/40 text-2xl h-full w-full text-center mt-10 animate-in fade-in">
                     {expectedLastfmError || (isLastfmError ? lastfmError.message : 'No beatmaps found')}
                     {!expectedLastfmError && !isLastfmError && (
                        <p className="text-base">Try another period, mode, or state filter.</p>
                     )}
                  </div>
               )}
               {isInitialLoading && <Loading className="top-39 h-[calc(100%-9.75rem)]" radius={50} />}
            </div>
         </main>
         <ToastContainer />
      </div>
   )
}
