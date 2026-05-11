import axios from 'axios'
import https from 'https'
import http from 'http'
import { getErrorHandlingMeta, modifyErrorMessage } from './errorHandling'

export const customAxios = axios.create({
   httpAgent: new http.Agent({ keepAlive: true }),
   httpsAgent: new https.Agent({ keepAlive: true }),
})

customAxios.interceptors.response.use(
   (response) => response,
   (err) => {
      const { skip, context } = getErrorHandlingMeta(err, 'SERVER_AXIOS')
      if (!skip) modifyErrorMessage(err, context)
      return Promise.reject(err)
   },
)
