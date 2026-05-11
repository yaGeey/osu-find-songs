import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
   images: {
      remotePatterns: [
         {
            protocol: 'https',
            hostname: 'assets.ppy.sh',
         },
      ],
   },
   turbopack: {
      root: __dirname,
   },
   experimental: {
      // viewTransition: true,
   },
   cacheComponents: true,
   productionBrowserSourceMaps: true,
}

export default nextConfig
