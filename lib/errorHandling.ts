import useBaseStore from '@/contexts/useBaseStore'
import { isAxiosError } from 'axios'

export const sendUnknownError = (err: unknown, context: string, throwErr: boolean = true) => {
   const blinkRef = useBaseStore.getState().progressNotifyRef
   if (blinkRef?.current) blinkRef.current.blink('error')

   const errToReport = modifyErrorMessage(err, context)
   if (throwErr && typeof window !== 'undefined' && typeof window.reportError === 'function') {
      window.reportError(errToReport)
   }
}

export const modifyErrorMessage = (err: unknown, context: string) => {
   const contextFormatted = context.split(' ').join('_').toUpperCase()
   if (err instanceof Error) {
      try {
         err.message = `[${contextFormatted}] ${err.message}`
      } catch {
         Object.defineProperty(err, 'message', {
            value: `[${contextFormatted}] ${err.message}`,
            writable: true,
            configurable: true,
            enumerable: false,
         })
      }
      return err
   }
   return new Error(`[${contextFormatted}] Unknown error: ${JSON.stringify(err)}`)
}

const ignoredErrorStatuses = [429, 404]
export const getErrorHandlingMeta = (err: unknown, context: string) => {
   if (isAxiosError(err)) {
      const ignoredErrors = (err.config?.ignoredErrors || []).concat(ignoredErrorStatuses)
      const status = err.response?.status || err.status
      if ((status && ignoredErrors?.includes(status)) || err.code === 'ERR_NETWORK') {
         return { skip: true, context }
      }
      if (err.config && err.config.context) {
         context = err.config.context
      }
   }
   return { skip: false, context }
}
