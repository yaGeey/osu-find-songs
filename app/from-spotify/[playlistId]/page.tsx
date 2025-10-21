'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { twMerge as tw } from 'tailwind-merge'
import { useParams, useSearchParams } from 'next/navigation'
import OsuCard from './_components/OsuCard'
import { QueryFunctionContext, useInfiniteQuery, useQueries, useQueryClient } from '@tanstack/react-query'
import { fetchWithToken } from '@/lib/Spotify'
import { PlaylistPage } from '@/types/Spotify'
import { Button } from '@/components/buttons/Buttons'
import { beatmapsSearch } from '@/lib/osu'
import HomeBtn from '@/components/buttons/HomeBtn'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload } from '@fortawesome/free-solid-svg-icons'
import Modal from '@/components/Modal'
import { BeatmapSet } from '@/types/Osu'
import OsuCardSet from './_components/OsuCardSet'
import { toast, ToastContainer } from 'react-toastify'
import Filters from './_components/Filters'
import Search from './_components/Search'
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
import { formatBytes } from '@/utils/numbers'
import { filterBeatmapsMatrix } from './_utils/filterBeatmapsMatrix'
const CHUNK_SIZE = 100

export default function PLaylistPage() {
   const params = useParams()
   const searchParams = useSearchParams()
   const { playlistId } = params
   const queryClient = useQueryClient()

   const progressNotifyRef = useRef<ProgressNotifyHandle | null>(null)
   const { pending, setProgressBlinkRef } = useMapDownloadStore()
   const bytesDownloaded = Object.values(pending).reduce((acc, cur) => acc + (cur.downloadedBytes || 0), 0)
   const bytesTotal = Object.values(pending).reduce((acc, cur) => acc + (cur.totalBytes || 0), 0)
   useEffect(() => {
      setProgressBlinkRef(progressNotifyRef)
   }, [setProgressBlinkRef, progressNotifyRef])

   const [hasQueryChanged, setHasQueryChanged] = useState(false)
   const [timeToSearch, setTimeToSearch] = useState<number | null>(null)
   const [searchType, setSearchType] = useState<'local' | 'api'>('api')
   const [beatmapsets, setBeatmapsets] = useState<BeatmapSet[][]>([])
   const [filteredBeatmapsets, setFilteredBeatmapsets] = useState<BeatmapSet[][]>([])
   const [spotifyTotal, setSpotifyTotal] = useState<number>(0)
   const [modal, setModal] = useState<null | { type: string; data?: any }>(null)

   // fetching playlist
   const {
      data: tracksData,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
      isLoading: isTracksLoading,
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
      throwOnError: (error, query) => {
         if (error.message.includes('An error occurred in the Server Components render.'))
            alert(
               "The playlist is either not public, or you're trying to use a daily playlist that Spotify generates only for you.",
            )
         else toast.error(`Error: ${error.message}`, { autoClose: false, closeButton: false })
         return false
      },
      retry: 0,
   })
   useEffect(() => {
      if (hasNextPage && !isFetchingNextPage) fetchNextPage()
   }, [hasNextPage, isFetchingNextPage, fetchNextPage])

   const tracks = tracksData?.pages.map((page: PlaylistPage) => page.items).flat() || []
   const isTracksLoadingFinal = isFetchingNextPage || hasNextPage || isTracksLoading || tracks.length < spotifyTotal
   const mapsFetched = beatmapsets.flat().length

   // beatmapset search
   const chunked = chunkArray(tracks, CHUNK_SIZE)
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
               s: searchParams.get('s'),
            }

            try {
               const { data } = await axios.post<BeatmapSet[][]>('/api/batch/osu-search', body, { signal })
               addTimeLeft(performance.now() - t0)
               return data
            } catch (err: any) {
               if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') throw new Error('canceled')
               throw err
            }
         },
         enabled: !!tracks,
         onError: (error: any) => {
            if (error.message === 'canceled') return // ігноруємо
            toast.error(`Error: ${error.message}`, { autoClose: false })
         },
      })),
   })

   const isLoading = beatmapsetQueries.some((q) => q.isLoading) || isTracksLoadingFinal
   const { addTimeLeft, resetTimeLeft, timeLeft, msLeft } = useTimeLeft(beatmapsetQueries.filter((q) => !q.isFetched).length)

   // setting data for display
   useEffect(() => {
      const data = beatmapsetQueries
         .filter((q) => q.data !== undefined)
         .map((q) => q.data)
         .flat()
      setBeatmapsets(data)
      setFilteredBeatmapsets(data)
   }, [beatmapsetQueries.filter((q) => !q.isLoading).length, beatmapsetQueries.filter((q) => !q.isFetching).length])

   // search
   useEffect(() => {
      if (!hasQueryChanged && !searchParams.get('q') && !searchParams.get('m') && !searchParams.get('s')) return
      else setHasQueryChanged(true)
      resetTimeLeft()

      let time = 0
      setTimeToSearch(time)

      if (searchType == 'api') {
         const interval = setInterval(() => {
            time += 100
            setTimeToSearch(Math.min(time, 2000))
         }, 100)

         const timer = setTimeout(async () => {
            const predicate = (query: any) => query.queryKey?.[0] === 'search-from-spotify'
            await queryClient.cancelQueries({ predicate }) // calls AbortController
            // removes only active queries, so completed ones stay in cache. Also triggres refetch as there is no result for subsribed queryKey
            queryClient.removeQueries({ predicate, type: 'active' })

            setTimeToSearch(null)
            clearInterval(interval)
         }, 2000)
         return () => {
            clearTimeout(timer)
            clearInterval(interval)
         }
      }
      if (searchType == 'local') console.log('local search')
   }, [searchParams.get('q'), searchParams.get('m'), searchParams.get('s')])

   // preparing data for display
   const maps = useMemo(
      () =>
         uniqueBeatmapsetMatrix(filteredBeatmapsets).sort((a, b) =>
            sortBeatmapsMatrix(a, b, searchParams.get('sort') || 'relevance_asc'),
         ),
      [filteredBeatmapsets, searchParams],
   )
   const { text, progress, handleDownloadAll } = useDownloadAll(maps)

   return (
      <div className="min-w-[685px] font-inter overflow-hidden">
         <BgImage className="brightness-[.75]" />

         {/* search timeout progress */}
         <Progress isVisible={!!timeToSearch} value={(timeToSearch! * 100) / 2000} color="text-main-lightest" />
         {/* loading progress */}
         <Progress
            isVisible={isLoading}
            value={spotifyTotal > 0 ? Math.min((mapsFetched / spotifyTotal) * 100, 100) : 0}
            isError={beatmapsetQueries.some((q) => q.isError)}
         >
            {msLeft > 5000 && (
               <span>
                  {mapsFetched}/{spotifyTotal} | {timeLeft} left
               </span>
            )}
         </Progress>
         {/* download all progress */}
         <Progress isVisible={progress !== null} value={progress || 0} isError={progress === -1} color="text-success">
            {text}
         </Progress>
         {/* notification progress */}
         <ProgressNotify ref={progressNotifyRef} color="text-success" />
         <Progress isVisible={!!Object.values(pending).length} value={(bytesDownloaded / bytesTotal) * 100 || 0}>
            {Object.values(pending).map(
               (p) =>
                  p.downloadedBytes &&
                  p.totalBytes && (
                     <p>
                        {p.filename} ({formatBytes(p.downloadedBytes)}/{formatBytes(p.totalBytes)} MB)
                     </p>
                  ),
            )}
         </Progress>

         <header
            className={tw(
               'min-w-[685px] bg-triangles [--color-dialog:var(--color-main])]  fixed z-100 w-screen h-14 flex justify-center items-center px-4 gap-10 border-b-3 border-main-darker',
            )}
         >
            <section className="absolute left-4 flex items-center gap-4">
               <HomeBtn />
               <a href="https://github.com/yaGeey/osu-find-songs" target="_blank" rel="noopener noreferrer">
                  <FontAwesomeIcon icon={faGithub} className="text-3xl -mb-1" />
               </a>
            </section>
            <Button onClick={() => setModal({ type: 'confirm-download' })} className="text-white py-1 w-45" disabled={isLoading}>
               Download all
               <FontAwesomeIcon icon={faDownload} className="ml-2" />
            </Button>
            <Search beatmapsets={beatmapsets} onChange={setFilteredBeatmapsets} />
         </header>

         <main className="flex justify-center items-center min-h-[calc(100vh-4rem)] mt-[56px]">
            <div className=" min-h-[calc(100vh-3.5rem)] bg-main-darker [@media(min-width:980px)]:w-4/5 w-full  max-w-[1800px]">
               <Filters
                  foundString={Array.isArray(maps) && maps.length ? maps.length + '/' + tracks.length : ''}
                  disabled={isLoading}
                  onFilterChange={(filters) => setFilteredBeatmapsets(filterBeatmapsMatrix(beatmapsets, filters))}
               />

               {!isLoading && maps.length < 45 ? (
                  <div className="flex p-4 gap-4 flex-wrap bg-main-darker overflow-y-auto max-h-[calc(100vh-3.5rem-127px)] scrollbar">
                     {maps.map((data, i) => {
                        if (data.length > 1 && data.length < 18)
                           return (
                              <OsuCardSet
                                 key={data[0].id + i}
                                 beatmapsets={data}
                                 sortQuery={searchParams.get('sort') || 'relevance_asc'}
                                 className="flex-grow animate-in fade-in duration-1000"
                              />
                           )
                        else
                           return (
                              <OsuCard
                                 key={data[0].id}
                                 beatmapset={data[0]}
                                 className="flex-grow animate-in fade-in duration-1000 shadow-sm"
                              />
                           )
                     })}
                  </div>
               ) : (
                  <VirtuosoCards maps={maps} sortQuery={searchParams.get('sort') || 'relevance_asc'} />
               )}
               {!isLoading && !maps.length && (
                  <div className="text-black/40 text-2xl h-full w-full text-center mt-10 animate-in fade-in">
                     No results found
                     <p className="text-base">Try setting the state to 'any' to see unranked maps</p>
                  </div>
               )}
               {isLoading && maps.length && <Loading />}
            </div>
         </main>

         {/* modals */}
         <Modal
            isOpen={modal?.type === 'confirm-download'}
            onOkay={() => {
               setModal({ type: 'downloading' })
               handleDownloadAll()
            }}
            okBtn="Download"
            onClose={() => setModal(null)}
            closeBtn="Close"
            state="info"
         >
            <p className="text-balance text-center">
               If there is more than one beatmap set for a song, the first one based on your search{' '}
               <span className="text-accent font-outline">filters</span> will be downloaded
            </p>
            {/* <p className=" text-center">Download with <span className="text-highlight font-outline">video</span>? It will take up more space.</p> */}
         </Modal>
         <Modal
            isOpen={modal?.type === 'downloading' && progress !== null}
            onOkay={() => setModal(null)}
            okBtn="Got it"
            state="info"
         >
            Please wait, this may take some time. Don't close this page
         </Modal>
         <Modal
            isOpen={modal?.type === 'downloading' && progress === null}
            onOkay={() => setModal(null)}
            okBtn="Close"
            state="success"
            dialog
         >
            Downloaded successfully
         </Modal>
         <ToastContainer />
      </div>
   )
}
