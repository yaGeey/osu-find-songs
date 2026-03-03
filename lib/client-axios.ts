import useBaseStore from '@/contexts/useBaseStore'
import axios from 'axios'

export const sendUnknownError = (err: unknown, context: string, throwErr: boolean = true) => {
   const blinkRef = useBaseStore.getState().progressNotifyRef
   if (blinkRef?.current) blinkRef.current.blink('error')

   if (err instanceof Error) {
      err.message = `[${context}] ${err.message}`
   }
   if (throwErr && typeof window !== 'undefined' && typeof window.reportError === 'function') {
      window.reportError(err)
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

      sendUnknownError(err, 'AXIOS')
      return Promise.reject(err)
   },
)

export default clientAxios
