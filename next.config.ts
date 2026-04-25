
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",

  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'static.wixstatic.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
       {
        protocol: 'https',
        hostname: 'www.noaa.gov',
        port: '',
        pathname: '/**',
      }
    ],
  },
   async rewrites() {
    return [
      {
        source: '/api/geocode',
        destination: '/api/geocode',
      },
    ];
  },
};

export default nextConfig;
