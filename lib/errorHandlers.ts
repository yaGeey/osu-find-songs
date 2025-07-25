import axios, { AxiosError } from 'axios'
// import { H } from '@highlight-run/next/server'

export function handleError(err: unknown, msg: string, payload?: { [key: string]: string }): void {
   if (axios.isAxiosError(err)) axiosErrorHandler(err, msg, payload)
   else unexpectedErrorHandler(err, msg, payload)
}

export function axiosErrorHandler(err: AxiosError, msg: string, payload?: { [key: string]: string }): void {
   // const { secureSessionId, requestId } = H.parseHeaders({})
   // H.consumeError(err, secureSessionId, requestId, {
   //    ...payload,
   //    data: JSON.stringify(err.response?.data) ?? 'Unknown error',
   //    status: err.response?.status.toString() ?? 'Unknown status',
   //    json: JSON.stringify(err.toJSON()),
   // })
   console.error(msg, err.toJSON())
}

export function unexpectedErrorHandler(err: unknown, msg: string, payload?: { [key: string]: string }): void {
   // const { secureSessionId, requestId } = H.parseHeaders({})
   const errMsg = `Unexpected ${msg}`
   const error = err instanceof Error ? err : new Error(String(err))
   Object.assign(error, { customMessage: errMsg, ...payload })
   // H.consumeError(error, secureSessionId, requestId, payload)
   console.error(errMsg, err)
}
