const path = require('path');

// Load environment variables from monorepo root .env if dotenv is present
try {
  const dotenv = require('dotenv');
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
  dotenv.config({ path: path.resolve(__dirname, '.env') });
} catch {
  // dotenv is optional; env vars are injected by Docker or process.env
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'images.unsplash.com',
      'pbs.twimg.com',
      'media.licdn.com',
      'platform-lookaside.fbsbx.com',
      'lh3.googleusercontent.com',
    ],
  },
  async rewrites() {
    // In docker network, INTERNAL_API_URL is http://api:4000; locally it defaults to http://localhost:4000
    const internalApiUrl = process.env.INTERNAL_API_URL || process.env.BACKEND_URL || 'http://localhost:4000';
    return [
      {
        source: '/api/:path*',
        destination: `${internalApiUrl}/api/:path*`,
      },
      {
        source: '/health',
        destination: `${internalApiUrl}/health`,
      },
    ];
  },
};

module.exports = nextConfig;
