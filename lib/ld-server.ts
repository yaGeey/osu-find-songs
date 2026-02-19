import { init } from '@launchdarkly/node-server-sdk'
import { Observability } from '@launchdarkly/observability-node'

let ldClient: ReturnType<typeof init> | null = null

export default async function getLDClient() {
   if (ldClient) return ldClient
   console.log('Initializing LaunchDarkly client...')

   const sdkKey = process.env.NODE_ENV === 'production' ? process.env.LD_SDK_KEY! : process.env.LD_SDK_KEY_TEST!
   ldClient = init(sdkKey!, {
      plugins: [
         new Observability({
            // TODO
            // backendUrl: process.env.NEXT_PUBLIC_LD_OBSERVABILITY_BACKEND_URL!,
            serviceVersion: process.env.VERCEL_GITHUB_COMMIT_SHA!,
            environment: process.env.NODE_ENV,
            serviceName: 'server',
         }),
      ],
   })

   await ldClient.waitForInitialization()
   return ldClient
}