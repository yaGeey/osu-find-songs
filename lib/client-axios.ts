import axios, { isAxiosError } from 'axios'
import { H } from '@highlight-run/next/client'

export const sendUnknownError = (err: unknown, context: string) => {
   const formatted = context.toUpperCase().replace(/ /g, '_')
   if (isAxiosError(err)) {
      H.consumeError(err, formatted, {
         status: String(err.response?.status),
         method: String(err.config?.method?.toUpperCase()),
         url: String(err.config?.url),

         // code: Важливо для мережевих помилок (напр. 'ECONNABORTED' це таймаут, 'ERR_NETWORK' це відсутність інтернету)
         error_code: String(err.code),

         // params: Query параметри (те, що після ? в URL: ?search=osu&page=1)
         request_params: JSON.stringify(err.config?.params ?? {}),

         // response_data: Що саме відповів сервер? (Там може бути {"error": "Invalid ID"})
         response_data_preview: JSON.stringify(err.response?.data ?? {}).slice(0, 500),

         // timeout: Який був налаштований таймаут (щоб зрозуміти, чи не замало ви дали часу)
         configured_timeout: String(err.config?.timeout),
      })
   } else if (err instanceof Error) {
      H.consumeError(err, formatted, {
         message: err.message,
         name: err.name,
         caues: String(err.cause),
      })
   } else {
      H.consumeError(new Error('Unknown error type'), formatted)
   }
}

const clientAxios = axios.create()

clientAxios.interceptors.response.use(
   (response) => response,
   (err) => {
      // Ignore rate limit
      if (axios.isAxiosError(err)) {
         if (err.response?.status === 429 || err.status === 429) {
            return Promise.reject(err)
         }
         console.error(`${err.response?.status} ${err.config?.method?.toUpperCase()} ${err.config?.url}`, {
            message: err.message,
            data: err.response?.data,
         })
      } else console.error('Unexpected error:', err)
      sendUnknownError(err, 'AXIOS')
      return Promise.reject(err)
   },
)

export default clientAxios
