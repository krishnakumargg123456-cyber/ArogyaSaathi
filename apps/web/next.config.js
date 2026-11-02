/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Ensure we can build without external API dependencies during Phase 2
};

module.exports = nextConfig;
