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
  },
  // Add security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://www.paypal.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.stripe.com https://api-m.paypal.com https://api.twitch.tv https://api.exchangerate-api.com; frame-src 'self' https://js.stripe.com https://www.paypal.com https://embed.twitch.tv https://player.twitch.tv;"
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig

