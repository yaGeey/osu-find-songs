import axios from 'axios'
import { sendUnknownError } from './errorHandling'

declare module 'axios' {
   export interface AxiosRequestConfig {
      context?: string
   }
}

const clientAxios = axios.create()

clientAxios.interceptors.response.use(
   (response) => response,
   (err) => {
      let context = 'CLIENT_AXIOS'
      if (axios.isAxiosError(err)) {
         if (err.response?.status === 429 || err.response?.status === 404) {
            return Promise.reject(err)
         }
         if (err.config && err.config.context) {
            context = err.config.context
         }
      }
      sendUnknownError(err, context)
      return Promise.reject(err)
   },
)

export default clientAxios
