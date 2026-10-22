import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
   images: {
      remotePatterns: [
         { protocol: 'https', hostname: 'assets.ppy.sh', pathname: '/**' },
         { protocol: 'https', hostname: 'i.scdn.co', pathname: '/**' },
         { protocol: 'https', hostname: 'i.ytimg.com', pathname: '/**' },
         { protocol: 'https', hostname: 'i.imgur.com', pathname: '/**' },
         { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
      ],
   },
   experimental: {
      durableUseCacheEntries: true,
      agentUpgrade: 'latest',
      agentFeedback: true,
      turbopackRustReactCompiler: true,
      turbopackGc: true,
      turbopackLazyDynamicImports: true,
   },
   cacheComponents: true,
   productionBrowserSourceMaps: true,
   reactCompiler: true,
   partialPrefetching: true,
}

export default nextConfig
