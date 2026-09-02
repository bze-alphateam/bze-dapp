/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Self-contained server build for the production Docker image.
  output: 'standalone',
}

module.exports = nextConfig
