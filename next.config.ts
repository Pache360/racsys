import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co', // Autoriza las imágenes que vienen de tu Supabase
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;