import { UseQueryResult } from '@tanstack/react-query'
import { useEffect, useMemo, useRef } from 'react'
import Cookies from 'js-cookie'
import { foTelemetryStart, foTelemetryError, foTelemetryFinishedSpotify, foTelemetryFinishedOsu } from '@/lib/telemetry'

export default function useFoTelemetry({
   spotifyQueries,
   osuQueries,
   songsLength,
}: {
   spotifyQueries: UseQueryResult<any[] | null, Error>[]
   osuQueries: UseQueryResult<any[] | null, Error>[]
   songsLength: number
}) {
   const isOsuFetching = osuQueries.some((q) => q.isFetching)
   const isSpotifyFetching = spotifyQueries.some((q) => q.isFetching)
   const hasInitialized = useRef(false)

   const sessionId = useMemo(() => localStorage.getItem('sessionId'), [])
   const telemetryIdRef = useRef<number | null>(null)
   useEffect(() => {
      if (process.env.NODE_ENV === 'development') return
      if (hasInitialized.current) return
      hasInitialized.current = true

      foTelemetryStart(songsLength, sessionId!)
         .then((id) => {
            telemetryIdRef.current = id
         })
         .catch(console.error)
   }, [])

   useEffect(() => {
      if (process.env.NODE_ENV === 'development') return
      if (!telemetryIdRef.current) return
      if (!isSpotifyFetching) foTelemetryFinishedSpotify(telemetryIdRef.current).catch(console.error)
      if (!isOsuFetching) foTelemetryFinishedOsu(telemetryIdRef.current).catch(console.error)
   }, [isSpotifyFetching, isOsuFetching])

   useEffect(() => {
      if (process.env.NODE_ENV === 'development') return
      if (!telemetryIdRef.current) return
      const hasErrors = spotifyQueries.some((q) => q.isError) || osuQueries.some((q) => q.isError)
      if (hasErrors) {
         const errorMessages = [
            ...spotifyQueries.filter((q) => q.isError).map((q) => `spotify: ${q.error}`),
            ...osuQueries.filter((q) => q.isError).map((q) => `osu: ${q.error}`),
         ].join(' | ')
         foTelemetryError(telemetryIdRef.current, errorMessages).catch(console.error)
      }
   }, [spotifyQueries.map((q) => q.isError).join(','), osuQueries.map((q) => q.isError).join(',')])
   return
}
