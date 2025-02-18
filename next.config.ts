import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['assets.ppy.sh', 'i.scdn.co', 'i.ytimg.com'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
