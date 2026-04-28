/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['graph.facebook.com'],
  },
  experimental: {
    serverActions: { bodySizeLimit: '50mb' },
  },
}

module.exports = nextConfig
