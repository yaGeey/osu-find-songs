import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['assets.ppy.sh', 'i.scdn.co', 'i.ytimg.com', 'i.imgur.com', 'lh3.googleusercontent.com'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    reactCompiler: true,
  }
};

export default nextConfig;
