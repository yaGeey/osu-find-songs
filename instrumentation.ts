import { H } from '@highlight-run/next/server'
import { type Instrumentation } from 'next'

export async function register() {
   if (process.env.NEXT_RUNTIME === 'nodejs') {
      if (!H.isInitialized()) {
         H.init({
            tracingOrigins: true,
            projectID: process.env.NEXT_PUBLIC_HIGHLIGHT_PROJECT_ID!,
            serviceName: process.env.HIGHLIGHT_APP_NAME!,
            networkRecording: {
               enabled: true,
               recordHeadersAndBody: true,
            },
            environment: process.env.NODE_ENV,
         })
      }
   }
}

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
   if (!(err instanceof Error)) return

   // get header
   const highlightHeader = request?.headers?.['x-highlight-request'] || ''
   const [secureSessionId, requestId] = typeof highlightHeader === 'string' ? highlightHeader.split('/') : [undefined, undefined]

   // custom metadata
   const metadata = {
      category: 'unhandled_server_error',
      severity: 'critical',

      next_route_path: context.routePath,
      next_route_type: context.routeType,

      http_method: request.method,
      http_url: request.path,
   }

   // send error
   H.consumeError(err, secureSessionId, requestId, metadata)
}
