/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is enabled by default in Next.js 13+
  // Force fresh build - clear Google OAuth cache
  generateBuildId: async () => {
    return 'build-' + Math.random().toString(36).substring(2, 15)
  },
  // Disable static optimization to force fresh builds
  experimental: {
    forceSwcTransforms: true,
  },
  // Clear all caches
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  }
}

module.exports = nextConfig

