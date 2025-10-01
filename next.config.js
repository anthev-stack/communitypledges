/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is enabled by default in Next.js 13+
  // Force fresh build - clear Google OAuth cache
  generateBuildId: async () => {
    return 'build-' + Date.now()
  }
}

module.exports = nextConfig

