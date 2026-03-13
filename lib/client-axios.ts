import useBaseStore from '@/contexts/useBaseStore'
import axios from 'axios'

export const sendUnknownError = (err: unknown, context: string, throwErr: boolean = true) => {
   const blinkRef = useBaseStore.getState().progressNotifyRef
   if (blinkRef?.current) blinkRef.current.blink('error')

   let errToReport = err
   if (err instanceof Error) {
      errToReport = new Error(`[${context.toUpperCase()}] ${err.message}`, { cause: err })
      if (err.stack) {
         ;(errToReport as Error).stack = err.stack
      }
      ;(errToReport as Error).name = err.name
   } else {
      errToReport = new Error(`[${context.toUpperCase()}] Unknown error: ${JSON.stringify(err)}`)
   }

   if (throwErr && typeof window !== 'undefined' && typeof window.reportError === 'function') {
      window.reportError(errToReport)
   }
}

const clientAxios = axios.create()

clientAxios.interceptors.response.use(
   (response) => response,
   (err) => {
      if (axios.isAxiosError(err)) {
         if (err.response?.status === 429 || err.response?.status === 404) {
            return Promise.reject(err)
         }
      }
      sendUnknownError(err, 'CLIENT')
      return Promise.reject(err)
   },
)

export default clientAxios
