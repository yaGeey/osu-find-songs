import axios from 'axios'
import { sendUnknownError, getErrorHandlingMeta } from './errorHandling'

declare module 'axios' {
   export interface AxiosRequestConfig {
      context?: string
      ignoredErrors?: number[]
   }
}

const clientAxios = axios.create()

clientAxios.interceptors.response.use(
   (response) => response,
   (err) => {
      const { skip, context } = getErrorHandlingMeta(err, 'CLIENT_AXIOS')
      if (!skip) sendUnknownError(err, context)
      return Promise.reject(err)
   },
)

export default clientAxios
