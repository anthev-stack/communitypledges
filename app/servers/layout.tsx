import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Browse Servers',
  description: 'Discover Discord servers and gaming communities. Browse servers by category, find active communities, and pledge towards server hosting costs.',
  openGraph: {
    title: 'Browse Discord Servers | CommunityPledges',
    description: 'Discover Discord servers and gaming communities. Browse servers by category, find active communities, and pledge towards server hosting costs.',
    url: 'https://communitypledges.com/servers',
    images: [
      {
        url: '/og-servers.png',
        width: 1200,
        height: 630,
        alt: 'Browse Discord Servers on CommunityPledges',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse Discord Servers | CommunityPledges',
    description: 'Discover Discord servers and gaming communities. Browse servers by category, find active communities, and pledge towards server hosting costs.',
    images: ['/og-servers.png'],
  },
}

export default function ServersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
