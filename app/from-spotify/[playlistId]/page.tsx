'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { twMerge as tw } from 'tailwind-merge'
import { useParams, useSearchParams } from 'next/navigation'
import OsuCard from './_components/OsuCard'
import { QueryFunctionContext, useInfiniteQuery, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchWithToken, getPlaylist } from '@/lib/Spotify'
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
import { FS_CHUNK_SIZE, MAPS_AMOUNT_TO_SHOW_VIRTUALIZED } from '@/variables'
import DevLoadingTime from '@/components/DevLoadingTime'

export default function PLaylistPage() {
   const params = useParams()
   const searchParams = useSearchParams()
   const { playlistId } = params
   const queryClient = useQueryClient()

   // download progress
   const progressNotifyRef = useRef<ProgressNotifyHandle | null>(null)
   const { pending, setProgressBlinkRef } = useMapDownloadStore()
   const bytesDownloaded = Object.values(pending).reduce((acc, cur) => acc + (cur.downloadedBytes || 0), 0)
   const bytesTotal = Object.values(pending).reduce((acc, cur) => acc + (cur.totalBytes || 0), 0)
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

   const [hasQueryChanged, setHasQueryChanged] = useState(false)
   const [timeToSearch, setTimeToSearch] = useState<number | null>(null)
   const [searchType, setSearchType] = useState<'local' | 'api'>('api')
   const [beatmapsets, setBeatmapsets] = useState<BeatmapSet[][]>([])
   const [filteredBeatmapsets, setFilteredBeatmapsets] = useState<BeatmapSet[][]>([])
   const [spotifyTotal, setSpotifyTotal] = useState<number>(0)
   const [modal, setModal] = useState<null | { type: string; data?: any }>(null)

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

   const isLoading = beatmapsetQueries.some((q) => q.isFetching) || isTracksLoadingFinal || playlistLoading
   const { addTimeLeft, resetTimeLeft, timeLeft, msLeft } = useTimeLeft(beatmapsetQueries.filter((q) => !q.isFetched).length)

   // setting data for display
   useEffect(() => {
      const data = beatmapsetQueries
         .filter((q) => q.data !== undefined)
         .map((q) => q.data)
         .flat()
         .filter((item): item is BeatmapSet[] => item !== null)
      setBeatmapsets(data)
      setFilteredBeatmapsets(data)
   }, [beatmapsetQueries.filter((q) => !q.isFetching).length])

   // filtering on query change
   useEffect(() => {
      const status = searchParams.get('s')
      const mode = searchParams.get('m')
      const modeMapped = { '0': 'osu', '1': 'taiko', '2': 'fruits', '3': 'mania' }[mode || '']
      setFilteredBeatmapsets(
         beatmapsets.map((set) =>
            set.filter(
               (map) =>
                  (status
                     ? status === 'any'
                        ? true
                        : map.status === status
                     : ['ranked', 'approved', 'loved', 'qualified'].includes(map.status)) &&
                  map.beatmaps.some((b) => (modeMapped ? b.mode === modeMapped : true)),
            ),
         ),
      )
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
      <div className="min-w-[690px] font-inter overflow-hidden">
         <DevLoadingTime isLoading={isLoading} dataLength={maps.length} />
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
               'min-w-[690px] bg-triangles [--color-dialog:var(--color-main])] fixed z-100 w-screen h-12 flex justify-between items-center px-4 gap-10 border-b-3 border-main-darker',
            )}
         >
            <section className="flex items-center gap-4">
               <HomeBtn />
               <a href="https://github.com/yaGeey/osu-find-songs" target="_blank" rel="noopener noreferrer">
                  <FontAwesomeIcon icon={faGithub} className="text-3xl -mb-1" />
               </a>
            </section>
            <p className={tw('absolute left-1/2 -translate-x-1/2 font-semibold text-main-gray', isLoading && 'animate-pulse')}>
               {playlistInfo?.name}
            </p>
            {/* TODO I REMOVED TEMPORARLT */}
            <Button
               onClick={() => setModal({ type: 'confirm-download' })}
               className="text-white py-0.5 px-5 bg-main-dark invisible"
               textClassName="font-outline-sm"
               disabled={isLoading}
            >
               Download all
               <FontAwesomeIcon icon={faDownload} className="ml-2" />
            </Button>
         </header>

         <main className="flex justify-center min-h-[calc(100vh-3rem)] mt-12">
            <div className="relative min-h-[calc(100vh-3rem)] bg-main-darker [@media(max-width:1000px)]:w-full [@media(max-width:1000px)]:min-w-[690px] w-4/5 min-w-[1000px] max-w-[1800px]">
               {/* TODO background image from playlist */}
               <div className="[background:url(/osu/tris-l-t.svg)_no-repeat,url(/osu/tris-r.svg)_no-repeat_bottom_right,var(--color-main-dark)] z-110 w-full top-12 px-5 py-2 text-white shadow-tight text-nowrap border-b-2 border-b-main-border">
                  <Filters
                     foundString={Array.isArray(maps) && maps.length ? maps.length + '/' + tracks.length : ''}
                     disabled={isLoading}
                     onFilterChange={(filters) => setFilteredBeatmapsets(filterBeatmapsMatrix(beatmapsets, filters))}
                     beatmapsets={beatmapsets}
                     onSearch={setFilteredBeatmapsets}
                  />
               </div>

               {!isLoading && maps.length < MAPS_AMOUNT_TO_SHOW_VIRTUALIZED ? (
                  <div className="flex p-4 gap-4 flex-wrap bg-main-darker overflow-y-auto max-h-[calc(100vh-3rem-127px)] scrollbar pb-12">
                     {maps.map((data, i) =>
                        data.length > 1 && (data.length < 18 || data[0].artist === data[1].artist) ? (
                           <OsuCardSet
                              key={data[0].id + i}
                              beatmapsets={data}
                              sortQuery={searchParams.get('sort') || 'relevance_asc'}
                              className="flex-grow animate-in fade-in duration-1000"
                           />
                        ) : (
                           <OsuCard
                              key={data[0].id}
                              beatmapset={data[0]}
                              className="flex-grow animate-in fade-in duration-1000 shadow-sm"
                           />
                        ),
                     )}
                     {!!(maps.length % 2) && <div className="flex-grow h-26 min-w-[386px] w-[464px]" />}
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
               {isLoading && <Loading className="top-39 h-[calc(100%-9.75rem)]" radius={50} />}
            </div>
         </main>

         {/* modals */}
         <Modal
            isOpen={modal?.type === 'confirm-download'}
            buttons={[
               {
                  onClick: () => setModal(null),
                  text: 'Cancel',
                  className: 'bg-error',
               },
               {
                  onClick: () => {
                     setModal({ type: 'downloading' })
                     handleDownloadAll()
                  },
                  text: 'Download',
                  className: 'bg-success',
               },
            ]}
            status="info"
         >
            <p className="text-balance text-center">
               If there is more than one beatmap set for a song, the first one based on your search{' '}
               <span className="text-accent font-outline-sm">filters</span> will be downloaded
            </p>
            {/* <p className=" text-center">Download with <span className="text-highlight font-outline">video</span>? It will take up more space.</p> */}
         </Modal>
         <Modal
            isOpen={modal?.type === 'downloading' && progress !== null}
            buttons={[
               {
                  onClick: () => setModal(null),
                  text: 'Okay',
                  className: 'bg-main-dark',
               },
            ]}
            status="info"
         >
            Please wait, this may take some time. Don't close this page
         </Modal>
         <Modal
            isOpen={modal?.type === 'downloading' && progress === null}
            buttons={[
               {
                  onClick: () => setModal(null),
                  text: 'Close',
                  className: 'bg-main-dark',
               },
            ]}
            status="success"
         >
            Downloaded successfully
         </Modal>
         <ToastContainer />
      </div>
   )
}
