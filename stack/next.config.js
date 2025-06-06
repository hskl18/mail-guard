/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Optimize imports to reduce bundle size
    optimizePackageImports: ["@aws-sdk/client-s3", "mysql2"],
  },

  webpack: (config, { dev, isServer }) => {
    // Optimize webpack for better performance
    if (!dev && !isServer) {
      // Split chunks more efficiently
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          aws: {
            name: "aws-sdk",
            test: /[\\/]node_modules[\\/]@aws-sdk/,
            priority: 20,
            reuseExistingChunk: true,
          },
          mysql: {
            name: "mysql",
            test: /[\\/]node_modules[\\/]mysql2/,
            priority: 20,
            reuseExistingChunk: true,
          },
          clerk: {
            name: "clerk",
            test: /[\\/]node_modules[\\/]@clerk/,
            priority: 15,
            reuseExistingChunk: true,
          },
        },
      };
    }

    return config;
  },

  // Reduce build output size
  compress: true,

  // Optimize images
  images: {
    domains: ["s3.amazonaws.com"],
    formats: ["image/webp", "image/avif"],
  },
};

module.exports = nextConfig;
