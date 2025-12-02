import axios, { AxiosError } from 'axios'
import https from 'https'
import http from 'http'

export const customAxios = axios.create({
   httpAgent: new http.Agent({ keepAlive: true }),
   httpsAgent: new https.Agent({ keepAlive: true }),
})

customAxios.interceptors.response.use(
   (response) => response,
   (err: AxiosError) => {
      if (err.response?.status !== 429 && err.status !== 429) {
         if (axios.isAxiosError(err)) {
            console.error(`${err.response?.status} ${err.config?.method?.toUpperCase()} ${err.config?.url}`, {
               message: err.message,
               data: err.response?.data,
            })
         } else {
            console.error('Unexpected error:', err)
         }
      }
      return Promise.reject(err)
   },
)