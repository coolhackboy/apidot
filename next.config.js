const createNextIntlPlugin = require('next-intl/plugin');
const { withContentCollections } = require("@content-collections/next");


const withNextIntl = createNextIntlPlugin('./i18n/routing.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['cdn.doculator.org', 'lh3.googleusercontent.com', 'storage.apidot.ai'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ];
  },
  webpack: (config, { dev }) => {
    // 禁用文件监听来避免 @parcel/watcher 问题
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
};

module.exports = withContentCollections(withNextIntl(nextConfig));
  
