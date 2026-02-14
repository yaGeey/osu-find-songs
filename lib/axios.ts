import axios, { AxiosError } from 'axios'
import https from 'https'
import http from 'http'
import { H } from '@highlight-run/next/server'

export const customAxios = axios.create({
   httpAgent: new http.Agent({ keepAlive: true }),
   httpsAgent: new https.Agent({ keepAlive: true }),
})

customAxios.interceptors.response.use(
   (response) => response,
   (err: AxiosError) => {
      // Ignore rate limit
      if (err.response?.status === 429 && err.status === 429) {
         return Promise.reject(err)
      } else {
         if (axios.isAxiosError(err)) {
            console.error(`${err.response?.status} ${err.config?.method?.toUpperCase()} ${err.config?.url}`, {
               message: err.message,
               data: err.response?.data,
            })
            H.consumeError(err, undefined, undefined, {
               type: 'AXIOS_ERROR',
               status: String(err.response?.status),
               url: err.config?.url,
            })
         } else {
            console.error('Unexpected error:', err)
            H.consumeError(err, undefined, undefined, {
               type: 'UNEXPECTED_ERROR',
            })
         }
      }
      return Promise.reject(err)
   },
)
