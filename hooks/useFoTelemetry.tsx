import { UseQueryResult } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import {
   foTelemetryStart,
   foTelemetryError,
   foTelemetryFinishedSpotify,
   foTelemetryFinishedOsu,
   foTelemetryAttachSession,
} from '@/lib/telemetry'
import useSessionId from './useSessionId'

export default function useFoTelemetry({
   spotifyQueries,
   osuQueries,
   songsLength,
}: {
   spotifyQueries: UseQueryResult<any[] | null, Error>[]
   osuQueries: UseQueryResult<any[] | null, Error>[]
   songsLength: number
}) {
   const shouldSkipTelemetry = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_FO_TELEMETRY_DEV !== 'true'

   const isOsuFetching = osuQueries.some((q) => q.isFetching)
   const isSpotifyFetching = spotifyQueries.some((q) => q.isFetching)

   const sessionId = useSessionId()
   const [isTelemetryReady, setIsTelemetryReady] = useState(false)
   const telemetryIdRef = useRef<number | undefined>(null)
   const telemetryStartPromiseRef = useRef<Promise<number | null | undefined> | null>(null)
   const spotifyFinishedSentRef = useRef(false)
   const osuFinishedSentRef = useRef(false)
   const lastErrorSentRef = useRef<string>('')
   const sessionAttachedRef = useRef(false)

   const errorMessage = [
      ...spotifyQueries.filter((q) => q.isError).map((q) => `spotify: ${q.error}`),
      ...osuQueries.filter((q) => q.isError).map((q) => `osu: ${q.error}`),
   ].join(' | ')

   const resolveTelemetryId = async () => {
      if (telemetryIdRef.current) return telemetryIdRef.current
      if (!telemetryStartPromiseRef.current) return null
      return telemetryStartPromiseRef.current
   }

   const reportTelemetryFailure = (error: unknown, step: string) => {
      console.error(error)
      if (typeof window === 'undefined' || typeof window.reportError !== 'function') return

      const message =
         error instanceof Error ? error.message : typeof error === 'string' ? error : JSON.stringify(error) || 'Unknown error'
      const errToReport =
         error instanceof Error
            ? new Error(`[FO_TELEMETRY:${step}] ${message}`, { cause: error })
            : new Error(`[FO_TELEMETRY:${step}] ${message}`)

      if (error instanceof Error) {
         errToReport.name = error.name
         if (error.stack) errToReport.stack = error.stack
      }

      window.reportError(errToReport)
   }

   useEffect(() => {
      if (shouldSkipTelemetry) return
      if (telemetryStartPromiseRef.current) return
      if (!sessionId) return

      telemetryStartPromiseRef.current = foTelemetryStart(songsLength, sessionId)
         .then((id) => {
            telemetryIdRef.current = id
            setIsTelemetryReady(!!id)
            return id
         })
         .catch((error) => {
            reportTelemetryFailure(error, 'START')
            return null
         })
   }, [songsLength, sessionId, shouldSkipTelemetry])

   useEffect(() => {
      if (shouldSkipTelemetry) return
      if (!sessionId || sessionAttachedRef.current) return
      if (!isTelemetryReady) return

      const attachSession = async () => {
         const id = await resolveTelemetryId()
         if (!id) return

         sessionAttachedRef.current = true
         await foTelemetryAttachSession(id, sessionId).catch((error) => {
            sessionAttachedRef.current = false
            reportTelemetryFailure(error, 'ATTACH_SESSION')
         })
      }

      void attachSession()
   }, [sessionId, isTelemetryReady, shouldSkipTelemetry])

   useEffect(() => {
      if (shouldSkipTelemetry) return
      if (!isTelemetryReady) return

      const sendFinishTelemetry = async () => {
         const id = await resolveTelemetryId()
         if (!id) return

         if (!isSpotifyFetching && !spotifyFinishedSentRef.current) {
            spotifyFinishedSentRef.current = true
            await foTelemetryFinishedSpotify(id).catch((error) => reportTelemetryFailure(error, 'FINISHED_SPOTIFY'))
         }

         if (!isOsuFetching && !osuFinishedSentRef.current) {
            osuFinishedSentRef.current = true
            await foTelemetryFinishedOsu(id).catch((error) => reportTelemetryFailure(error, 'FINISHED_OSU'))
         }
      }

      void sendFinishTelemetry()
   }, [isSpotifyFetching, isOsuFetching, isTelemetryReady, shouldSkipTelemetry])

   useEffect(() => {
      if (shouldSkipTelemetry) return
      if (!isTelemetryReady) return

      const sendErrorTelemetry = async () => {
         if (!errorMessage || errorMessage === lastErrorSentRef.current) return

         const id = await resolveTelemetryId()
         if (!id) return

         lastErrorSentRef.current = errorMessage
         await foTelemetryError(id, errorMessage).catch((error) => reportTelemetryFailure(error, 'ERROR'))
      }

      void sendErrorTelemetry()
   }, [errorMessage, isTelemetryReady, shouldSkipTelemetry])

   return
}
