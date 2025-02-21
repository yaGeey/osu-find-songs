import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['assets.ppy.sh', 'i.scdn.co', 'i.ytimg.com', 'i.imgur.com'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
