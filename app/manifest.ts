import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CommunityPledges',
    short_name: 'CommunityPledges',
    description: 'Share server costs with your community. Discover Discord servers, pledge towards hosting costs, and build stronger gaming communities together.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#10b981',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    categories: ['gaming', 'social', 'productivity'],
    lang: 'en',
    orientation: 'portrait-primary',
  }
}
