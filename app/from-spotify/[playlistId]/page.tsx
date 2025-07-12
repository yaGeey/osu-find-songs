'use client'
import { useEffect, useMemo, useState } from 'react'
import { twMerge as tw } from 'tailwind-merge'
import { useParams, useSearchParams } from 'next/navigation'
import OsuCard from '@/components/cards/OsuCard'
import { useInfiniteQuery, useQueries, useQueryClient } from '@tanstack/react-query'
import { fetchWithToken } from '@/lib/Spotify'
import { PlaylistPage } from '@/types/Spotify'
import { Button } from '@/components/buttons/Buttons'
import { beatmapsSearch } from '@/lib/osu'
import HomeBtn from '@/components/buttons/HomeBtn'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload } from '@fortawesome/free-solid-svg-icons'
import Modal from '@/components/Modal'
import { BeatmapSet } from '@/types/Osu'
import OsuCardSet from '@/components/cards/OsuCardSet'
import { toast, ToastContainer } from 'react-toastify'
import Filters from './Filters'
import Search from './Search'
import Progress from '@/components/state/Progress'
import BgImage from '@/components/BgImage'
import { LinearProgress } from '@mui/material'
import { sortBeatmapsMatrix } from '@/utils/sortBeatmapsMatrix'
import { uniqueArray, uniqueBeatmapsetMatrix } from '@/utils/arrayManaging'
import useDownloadAll from '@/hooks/useDownloadAll'
import { faGithub } from '@fortawesome/free-brands-svg-icons'
import useTimeLeft from '@/hooks/useTimeLeft'
import { on } from 'events'

export default function PLaylistPage() {
   const params = useParams()
   const searchParams = useSearchParams()
   const { playlistId } = params

   const [queriesDict, setQueriesDict] = useState<{ [key: string]: string }>({})
   const [hasQueryChanged, setHasQueryChanged] = useState(false)
   const [timeToSearch, setTimeToSearch] = useState<number | null>(null)
   const [searchType, setSearchType] = useState<'local' | 'api'>('api')
   const [beatmapsets, setBeatmapsets] = useState<BeatmapSet[][]>([])
   const [filteredBeatmapsets, setFilteredBeatmapsets] = useState<BeatmapSet[][]>([])

   const [isModalVisible, setIsModalVisible] = useState(false)
   const [isModalDownloadingVisible, setIsModalDownloadingVisible] = useState(false)
   const [isModalDownloadedVisible, setIsModalDownloadedVisible] = useState(false)

   // fetching playlist
   const {
      data: tracksData,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
   } = useInfiniteQuery({
      queryKey: ['spotify-playlist', playlistId], //? idk why but this cause endless fetching on first page load, so...
      queryFn: async ({ pageParam = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=0&limit=100` }) =>
         await fetchWithToken(pageParam),
      getNextPageParam: (lastPage) => (lastPage.next ? lastPage.next : undefined),
      getPreviousPageParam: (firstPage) => (firstPage.previous ? firstPage.previous : undefined),
      initialPageParam: `https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=0&limit=100`,
      throwOnError: (error, query) => {
         toast.error(`Error: ${error.message}`, { autoClose: false, closeButton: false })
         return false
      },
      retry: 0,
   })
   useEffect(() => {
      if (hasNextPage && !isFetchingNextPage) fetchNextPage()
   }, [hasNextPage, isFetchingNextPage, fetchNextPage])

   const queryClient = useQueryClient()
   useEffect(() => {
      //? ...we are cancelling the query on mount and the refetching it
      // console.log('cancelling query', playlistId);
      // queryClient.cancelQueries({ queryKey: ['spotify-playlist', playlistId] })
      // refetch();
   }, [])

   const tracks = tracksData?.pages.map((page: PlaylistPage) => page.items).flat() || []

   // beatmapset search
   const beatmapsetQueries = useQueries({
      queries: tracks.map((track) => ({
         queryKey: ['beatmapset', track.track ? track.track.artists[0].name : 'err', track.track ? track.track.name : 'err'],
         queryFn: async () => {
            const t0 = performance.now()
            if (!track.track) return [] //? odd error rarely occurs
            const res = await beatmapsSearch({
               q: `artist=${track.track.artists[0].name} title=${track.track.name} ${searchParams.get('q') || ''}`,
               // sort: searchParams.get('sort'),
               m: searchParams.get('m'),
               s: searchParams.get('s'),
            })
            addTimeLeft(performance.now() - t0)
            return res
         },
         enabled: !!tracks,
         staleTime: Infinity,
         onError: (error: any) => toast.error(`Error: ${error.message}`, { autoClose: false }),
      })),
   })
   const isLoading = useMemo(() => beatmapsetQueries.some((q) => q.isLoading), [beatmapsetQueries])
   const { addTimeLeft, resetTimeLeft, timeLeft, msLeft } = useTimeLeft(beatmapsetQueries.filter((q) => !q.isFetched).length)

   // setting data for display
   useEffect(() => {
      const data = beatmapsetQueries.map((q) => q.data?.beatmapsets)
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

         const timer = setTimeout(() => {
            queryClient.removeQueries({
               predicate: (query) => {
                  return query.queryKey[0] !== 'spotify-playlist'
               },
            })
            beatmapsetQueries.forEach((query) => query.refetch())

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

   const { current, progress, handleDownloadAll } = useDownloadAll(beatmapsetQueries)

   return (
      <div className="max-h-screen min-w-[800px] min-h-[670px] font-inter overflow-y-auto scrollbar">
         <BgImage brightness={8} image="/bg.svg" />

         {/* search timeout progress */}
         <Progress isVisible={!!timeToSearch} value={(timeToSearch! * 100) / 2000} color="text-main-lighter" />

         {/* fetching spotify progress */}
         <Progress
            isVisible={isLoading}
            value={(beatmapsetQueries.filter((q) => !q.isLoading).length * 100) / tracks.length}
            isError={beatmapsetQueries.some((q) => q.isError)}
         >
            {msLeft > 5000 && (
               <span>
                  {beatmapsetQueries.filter((q) => !q.isLoading).length}/{tracks.length} | {timeLeft} left
               </span>
            )}
         </Progress>

         {/* download all progress */}
         <Progress isVisible={progress !== null} value={progress || 0} isError={progress === -1} color="text-success">
            {current}
         </Progress>

         <header
            className={tw(
               'min-w-[800px] bg-triangles fixed z-100 w-screen h-14 flex justify-center items-center px-4 gap-10 border-b-3 border-darker',
            )}
         >
            <section className="absolute left-4 flex items-center gap-4">
               <HomeBtn />
               <a href="https://github.com/yaGeey/osu-find-songs" target="_blank" rel="noopener noreferrer">
                  <FontAwesomeIcon icon={faGithub} className="text-3xl -mb-1" />
               </a>
            </section>
            <Button onClick={() => setIsModalVisible(true)} className="text-white py-1 w-45">
               Download all
               <FontAwesomeIcon icon={faDownload} className="ml-2" />
            </Button>
            <Search beatmapsets={beatmapsets} onChange={setFilteredBeatmapsets} />
         </header>

         <main className="flex justify-center items-center min-h-[calc(100vh-4rem)] mt-[56px]">
            <div className=" min-h-[calc(100vh-3.5rem)] bg-darker [@media(min-width:980px)]:w-4/5 w-full ">
               <Filters
                  foundString={
                     beatmapsets.length ? beatmapsets.filter((a) => !!a && a.length).length + '/' + beatmapsets.length : ''
                  }
                  onChange={(val, searchTypeRes, mode) => {
                     setQueriesDict({ sort: val, m: mode })
                     setSearchType(searchTypeRes)
                  }}
               />

               <div className="flex p-4 gap-4 flex-wrap bg-darker overflow-y-auto">
                  {uniqueBeatmapsetMatrix(filteredBeatmapsets.filter((data) => data && data.length))
                     .sort((a, b) => sortBeatmapsMatrix(a, b, searchParams.get('sort') || 'relevance_asc'))
                     .map((data, i) => {
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
                  {!filteredBeatmapsets.filter((data) => data && data.length).length && !isLoading && (
                     <div className="text-black/40 text-2xl h-full w-full text-center mt-10 animate-in fade-in">
                        No results found
                        <p className="text-base">Try setting the state to 'any' to see unranked maps</p>
                     </div>
                  )}
               </div>
            </div>
         </main>

         {/* modals */}
         <Modal
            isOpen={isModalVisible}
            onOkay={() => {
               setIsModalVisible(false)
               setIsModalDownloadingVisible(true)
               handleDownloadAll()
            }}
            okBtn="Download"
            onClose={() => {
               setIsModalVisible(false)
            }}
            closeBtn="Close"
            state="info"
         >
            <p className="text-balance text-center">
               If there is more than one beatmap set for a song, the first one based on your search{' '}
               <span className="text-highlight font-outline">filters</span> will be downloaded
            </p>
            {/* <p className=" text-center">Download with <span className="text-highlight font-outline">video</span>? It will take up more space.</p> */}
         </Modal>
         <Modal isOpen={isModalDownloadingVisible} onOkay={() => setIsModalDownloadingVisible(false)} okBtn="Got it" state="info">
            Please wait, this may take some time. Don't close this page
         </Modal>
         <Modal
            isOpen={isModalDownloadedVisible}
            onOkay={() => setIsModalDownloadedVisible(false)}
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
