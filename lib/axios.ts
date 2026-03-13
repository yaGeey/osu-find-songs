import axios, { AxiosError } from 'axios'
import https from 'https'
import http from 'http'
import { LDObserve } from '@launchdarkly/observability-node'

export const customAxios = axios.create({
   httpAgent: new http.Agent({ keepAlive: true }),
   httpsAgent: new https.Agent({ keepAlive: true }),
})

customAxios.interceptors.response.use(
   (response) => response,
   (err: AxiosError) => {
      if (err.response?.status === 429 || err.status === 429 || err.status === 404) {
         // Ignore rate limit and not found errors
         return Promise.reject(err)
      }
      LDObserve.recordError(err, undefined, undefined)
      return Promise.reject(err)
   },
)
