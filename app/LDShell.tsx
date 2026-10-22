'use client'
import { LDProvider } from 'launchdarkly-react-client-sdk'
import Observability from '@launchdarkly/observability'
import SessionReplay from '@launchdarkly/session-replay'

const tracingOrigins = ['https://osu.yageey.me/api', 'https://osufindsongs.vercel.app/api', 'http://localhost:3000/api']

export default function LDShell({ clientSideID }: { clientSideID: string }) {
   return (
      <LDProvider
         clientSideID={clientSideID}
         options={{
            bootstrap: 'localStorage',
            plugins: [
               new Observability({
                  tracingOrigins,
                  networkRecording: {
                     enabled: true,
                     recordHeadersAndBody: true,
                  },
                  environment: process.env.NODE_ENV,
                  backendUrl: 'https://pub-ld.yageey.me',
                  otel: { otlpEndpoint: 'https://otel-ld.yageey.me' },
                  version: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA!,
                  serviceName: 'client',
               }),
               new SessionReplay({
                  privacySetting: 'none',
                  version: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA!,
                  serviceName: 'client',
                  environment: process.env.NODE_ENV,
                  backendUrl: 'https://pub-ld.yageey.me',
                  tracingOrigins,
               }),
            ],
         }}
      >
         <></>
      </LDProvider>
   )
}
