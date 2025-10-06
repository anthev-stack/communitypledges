import HomePageContent from '@/components/HomePageContent'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Home',
  description: 'Share server costs with your community. Discover Discord servers, pledge towards hosting costs, and build stronger gaming communities together.',
  openGraph: {
    title: 'CommunityPledges - Share Server Costs with Your Community',
    description: 'Join CommunityPledges to share server costs with your community. Discover Discord servers, pledge towards hosting costs, and build stronger gaming communities together.',
    url: 'https://communitypledges.com',
    images: [
      {
        url: '/og-home.png',
        width: 1200,
        height: 630,
        alt: 'CommunityPledges Homepage - Share Server Costs',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CommunityPledges - Share Server Costs with Your Community',
    description: 'Join CommunityPledges to share server costs with your community. Discover Discord servers, pledge towards hosting costs, and build stronger gaming communities together.',
    images: ['/og-home.png'],
  },
}

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto">
      <HomePageContent />
    </div>
  )
}


