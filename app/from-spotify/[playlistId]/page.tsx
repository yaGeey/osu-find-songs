'use client'
import { useEffect, useMemo, useState } from 'react'
import { twMerge as tw } from 'tailwind-merge'
import { useParams, useSearchParams } from 'next/navigation'
import { QueryFunctionContext, useInfiniteQuery, useQueries, useQuery } from '@tanstack/react-query'
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
import { filterBeatmapsMatrix } from './_utils/filterBeatmapsMatrix'
import DevLoadingTime from '@/components/DevLoadingTime'
import DownloadAllBtn from './_components/DownloadAllBtn'
import ProgressMapDownload from './_components/ProgressMapDownload'
import { SelectedOption } from '@/components/selectors/FilterOptions'
import Image from 'next/image'
import CustomLink from '@/components/CustomLink'
import { AnimatePresence, motion } from 'framer-motion'
import IconsSection from '@/components/IconsSection'
import { fetchPlaylist, fetchPlaylistContents } from '@/lib/spotify/actions/innerApi'
import clientAxios from '@/lib/clientAxios'
import useNotifyStore from '@/contexts/useNotifyStore'
import { NotifyHeader } from '@/components/state/HeaderError'
import { useMapDownloadStore } from '@/contexts/useMapDownloadStore'

const CHUNK_SIZE = 50

export type Queries = {
   sort: string
   status: string | null
   mode: string | null
   search: string
   filters: string
}

export default function PlaylistPage() {
   const params = useParams()
   const searchParams = useSearchParams()
   const { playlistId } = params
   const progressNotifyRef = useNotifyStore((state) => state.notifyRef)
   const notify = useNotifyStore((state) => state.notificationBlink)

   // remove scrollbar
   useEffect(() => {
      document.body.style.overflow = 'hidden'
      return () => {
         document.body.style.overflow = ''
      }
   }, [])

   const [filters, setFilters] = useState<SelectedOption[]>([])
   const [searchQuery, setSearchQuery] = useState('')

   const tokensQ = useQuery({
      queryKey: ['spotifyIntTokens'],
      enabled: false,
   })

   const {
      data: playlistInfo,
      isPending: isPlaylistInfoPending,
      isError: isPlaylistInfoError,
      refetch: retryPlaylistInfo,
   } = useQuery({
      queryKey: ['spotify-playlist-info', playlistId],
      queryFn: async () => fetchPlaylist(playlistId as string),
      meta: { errMsg: 'Failed to fetch playlist info' },
   })

   // fetching playlist
   //TODO keep in mind - 800+600 ms delay (change it)
   const {
      data,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
      isFetching: isTracksFetching,
      isPending: isTracksPending,
      isError: isTracksError,
      refetch: retryTracks,
   } = useInfiniteQuery({
      queryKey: ['spotify-playlist', playlistId],
      queryFn: async ({ pageParam = 0 }) => {
         if (pageParam !== 0) {
            const delay = Math.floor(Math.random() * 600) + 800
            await new Promise((r) => setTimeout(r, delay))
         }
         return await fetchPlaylistContents(playlistId as string, pageParam)
      },
      meta: { errMsg: 'Failed to fetch playlist tracks' },
      getNextPageParam: (lastPage) => lastPage.nextOffset,
      initialPageParam: 0,
      retry: 0,
   })

   // continue fetching
   useEffect(() => {
      //? hasNextPage is derived from the last successful page, so it stays true after a
      //? failed page and the effect would retry it forever
      if (!hasNextPage || isFetchingNextPage || isTracksError) return
      void fetchNextPage()
   }, [hasNextPage, isFetchingNextPage, isTracksError, fetchNextPage])

   const tracks = useMemo(() => data?.pages.flatMap((page) => page.items.map((i) => i.itemV2.data)) || [], [data])
   const spotifyTotal = data?.pages?.[0]?.total || 0
   const isTracksLoadingFinal =
      !isTracksError &&
      (isTracksPending || isFetchingNextPage || hasNextPage || isTracksFetching || tracks.length < spotifyTotal)

   // beatmapset search
   const chunked = useMemo(() => chunkArray(tracks, CHUNK_SIZE), [tracks])
   const searchParamQ = searchParams.get('q') || ''
   const beatmapsetQueries = useQueries({
      queries: chunked.map((chunk) => ({
         queryKey: ['search-from-spotify', chunk?.[0]?.uri?.split(':').at(-1) ?? 'err', searchParamQ],
         queryFn: async ({ signal }: QueryFunctionContext) => {
            const qs = chunk
               .map((item) => {
                  if (!item) return
                  const artistName = item.artists?.items?.[0]?.profile?.name
                  if (!artistName) return //? sometimes no items in artists, idk why
                  return `artist=${artistName} title=${item.name} ${searchParamQ}`
               })
               .filter((q): q is string => Boolean(q))
            if (!qs.length) return []

            const t0 = performance.now()
            const { data } = await clientAxios
               .post<(BeatmapSet[] | null)[]>(
                  '/api/batch/osu-search',
                  { qs },
                  {
                     signal,
                     context: 'search from spotify',
                  },
               )
               .catch((err) => (err.response?.status === 404 ? { data: [] } : Promise.reject(err)))
            addTimeLeft(performance.now() - t0)
            return data
         },
      })),
   })

   const isTokensUnavailable = tokensQ.isError && !tokensQ.data
   const pageError = isTokensUnavailable
      ? 'Could not connect to Spotify right now. Please try again in a moment.'
      : isPlaylistInfoError
        ? 'Could not load this Spotify playlist.'
        : isTracksError
          ? 'Could not load this playlist’s tracks.'
          : null
   const isLoading =
      !pageError && (beatmapsetQueries.some((q) => q.isFetching) || isPlaylistInfoPending || isTracksLoadingFinal)

   const retryPageLoad = async () => {
      if (isTokensUnavailable) await tokensQ.refetch()
      if (isPlaylistInfoError) void retryPlaylistInfo()
      if (isTracksError) void retryTracks()
   }
   const { addTimeLeft, timeLeft, msLeft } = useTimeLeft(beatmapsetQueries.filter((q) => !q.isFetched).length)

   // full data
   const mapsSignature = beatmapsetQueries.map((q) => `${q.dataUpdatedAt}:${q.data?.length ?? 0}`).join('|')
   const mapsFlatten = useMemo(
      () =>
         beatmapsetQueries
            .map((q) => q.data)
            .flat()
            .filter((item) => item != null),
      [mapsSignature],
   )
   const mapsFetched = mapsFlatten.length

   const queries: Queries = {
      sort: searchParams.get('sort') || 'relevance_asc',
      status: searchParams.get('s'),
      mode: searchParams.get('m'),
      search: searchQuery,
      filters: JSON.stringify(filters),
   }

   // prepare data for display
   const maps = useMemo(() => {
      const modeMapped = { '0': 'osu', '1': 'taiko', '2': 'fruits', '3': 'mania' }[queries.mode || '']
      const queryLower = queries.search.toLowerCase().trim()

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

      return uniqueBeatmapsetMatrix(filtered).sort((a, b) => sortBeatmapsMatrix(a, b, queries.sort))
   }, [queries, mapsFlatten])

   const { text, progress, handleDownloadAll } = useDownloadAll(maps, queries.sort)

   // Handle errors
   useEffect(() => {
      if (beatmapsetQueries.some((q) => q.isError)) {
         const errorMsg = beatmapsetQueries.find((q) => q.isError)?.error?.message
         console.error('Error fetching beatmaps from Spotify playlist:', errorMsg)
         notify({ type: 'error', content: 'An error occurred while fetching beatmaps' }, 4000)
      }
   }, [beatmapsetQueries.map((q) => q.isError).join(',')])

   useEffect(() => {
      if (progress === -1) notify({ type: 'error', content: 'An error occurred during the download process' }, 4000)
   }, [progress])

   // TODO when const isDownloadAvailable = useMapDownloadStore((state) => state.isAvailableMirror) is not - show an error once
   const isDownloadAvailable = useMapDownloadStore((state) => state.isAvailableMirror)
   return (
      <div className="min-w-[710px] overflow-hidden" translate="no">
         <DevLoadingTime isLoading={isLoading} dataLength={maps.length} />
         <style>{`
         body {
            --bg-brightness: .25;
         }
         `}</style>

         <header
            className={tw(
               'min-w-[710px] bg-triangles [--color-dialog:var(--color-main])] fixed z-1000 w-screen h-12 flex justify-between items-center gap-10 border-b-3 border-main-darker',
            )}
         >
            <Progress
               isVisible={isLoading}
               value={spotifyTotal > 0 ? Math.min((mapsFetched / spotifyTotal) * 100, 100) : 0}
            >
               {msLeft > 5000 && (
                  <span>
                     {mapsFetched}/{spotifyTotal} | {timeLeft} left
                  </span>
               )}
            </Progress>
            <Progress isVisible={progress !== null} value={progress || 0} color="text-success">
               {text}
            </Progress>
            <ProgressMapDownload />

            <div className="px-4">
               <IconsSection />
            </div>
            <AnimatePresence>
               <NotifyHeader ref={progressNotifyRef}>
                  {playlistInfo?.name && (
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
                  )}
               </NotifyHeader>
            </AnimatePresence>
            <div className="_invisible px-4">
               <DownloadAllBtn
                  disabled={isLoading || isDownloadAvailable === false}
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
                           key={maps[0][0]?.covers['cover@2x']}
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           exit={{ opacity: 0 }}
                           transition={{ duration: 0.1 }}
                        >
                           <Image
                              src={maps[0][0]?.covers['cover@2x']}
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
                  <div className="relative flex flex-col gap-3 text-[15px]">
                     <Filters disabled={isLoading} onFilterChange={setFilters} onSearch={setSearchQuery} />
                     {Array.isArray(maps) && !isLoading && (
                        <div className="absolute right-2 bottom-1 rounded-xl gap-1 text-white/90 tracking-wide text-sm hidden [@media(min-width:830px)]:grid text-end">
                           <p>{`${mapsFetched}/${tracks.length} found`}</p>
                           <p>{`${maps.length} displayed`}</p>
                        </div>
                     )}
                  </div>
               </div>
               <VirtuosoCards maps={maps} queries={queries} />
               {!isLoading && pageError && (
                  <div
                     role="alert"
                     className="mx-auto mt-10 flex max-w-xl flex-col items-center gap-3 rounded-lg border border-error/50 bg-main-light p-5 text-center text-white"
                  >
                     <p>{pageError}</p>
                     <button
                        type="button"
                        onClick={retryPageLoad}
                        className="rounded-md border border-white/40 px-4 py-1.5 transition-colors hover:bg-white/10"
                     >
                        Try again
                     </button>
                  </div>
               )}
               {!isLoading && !pageError && !maps.length && (
                  <div className="no-jump text-black/40 text-2xl h-full w-full text-center mt-10 animate-in fade-in">
                     {playlistInfo === null ? 'Playlist not found or is private' : 'No results found'}
                     {playlistInfo !== null && (
                        <p className="text-base">Try setting the state to &apos;any&apos; to see unranked maps</p>
                     )}
                  </div>
               )}
               {isLoading && <Loading className="top-39 h-[calc(100%-9.75rem)]" radius={50} />}
            </div>
         </main>
         <ToastContainer />
      </div>
   )
}
