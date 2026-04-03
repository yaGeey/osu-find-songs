import axios from 'axios'
import https from 'https'
import http from 'http'
import { LDObserve } from '@launchdarkly/observability-node'
import { modifyErrorMessage } from './errorHandling'

export const customAxios = axios.create({
   httpAgent: new http.Agent({ keepAlive: true }),
   httpsAgent: new https.Agent({ keepAlive: true }),
})

customAxios.interceptors.response.use(
   (response) => response,
   (err) => {
      let context = 'SERVER_AXIOS'
      if (axios.isAxiosError(err)) {
         if (err.response?.status === 429 || err.response?.status === 404) {
            return Promise.reject(err)
         }
         if (err.config && err.config.context) {
            context = err.config.context
         }
      }
      const errToReport = modifyErrorMessage(err, context)
      LDObserve.recordError(errToReport, undefined, undefined)
      return Promise.reject(errToReport)
   },
)
