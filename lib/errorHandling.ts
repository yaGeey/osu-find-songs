import useBaseStore from '@/contexts/useBaseStore'

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
   let errToReport: Error
   if (err instanceof Error) {
      errToReport = new Error(`[${contextFormatted}] ${err.message}`, { cause: err })
      if (err.stack) {
         ;(errToReport as Error).stack = err.stack
      }
      ;(errToReport as Error).name = err.name
   } else {
      errToReport = new Error(`[${contextFormatted}] Unknown error: ${JSON.stringify(err)}`)
   }
   return errToReport
}
