import axios from 'axios'
import https from 'https'
import http from 'http'
import { LDObserve } from '@launchdarkly/observability-node'
import { getErrorHandlingMeta, modifyErrorMessage } from './errorHandling'

export const customAxios = axios.create({
   httpAgent: new http.Agent({ keepAlive: true }),
   httpsAgent: new https.Agent({ keepAlive: true }),
})

customAxios.interceptors.response.use(
   (response) => response,
   (err) => {
      const { skip, context } = getErrorHandlingMeta(err, 'SERVER_AXIOS')
      const errToReport = modifyErrorMessage(err, context)
      if (!skip) LDObserve.recordError(errToReport, undefined, undefined)
      return Promise.reject(err)
   },
)
