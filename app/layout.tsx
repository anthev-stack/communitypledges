import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { ActivityNotificationProvider } from '@/contexts/ActivityNotificationContext'
import { CurrencyProvider } from '@/contexts/CurrencyContext'
import NotificationContainer from '@/components/NotificationContainer'
import SessionDebug from '@/components/SessionDebug'
import BatsProvider from '@/components/BatsProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: {
    default: 'CommunityPledges - Share Server Costs with Your Community',
    template: '%s | CommunityPledges'
  },
  description: 'Join CommunityPledges to share server costs with your community. Discover Discord servers, pledge towards hosting costs, and build stronger gaming communities together.',
  keywords: [
    'Discord servers',
    'community hosting',
    'server costs',
    'gaming communities',
    'Discord bot hosting',
    'community funding',
    'server sharing',
    'gaming servers',
    'community management',
    'server hosting costs'
  ],
  authors: [{ name: 'CommunityPledges Team' }],
  creator: 'CommunityPledges',
  publisher: 'CommunityPledges',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://communitypledges.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://communitypledges.com',
    title: 'CommunityPledges - Share Server Costs with Your Community',
    description: 'Join CommunityPledges to share server costs with your community. Discover Discord servers, pledge towards hosting costs, and build stronger gaming communities together.',
    siteName: 'CommunityPledges',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CommunityPledges - Share Server Costs with Your Community',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CommunityPledges - Share Server Costs with Your Community',
    description: 'Join CommunityPledges to share server costs with your community. Discover Discord servers, pledge towards hosting costs, and build stronger gaming communities together.',
    images: ['/og-image.png'],
    creator: '@communitypledges',
    site: '@communitypledges',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code', // Replace with actual verification code
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "CommunityPledges",
    "description": "Share server costs with your community. Discover Discord servers, pledge towards hosting costs, and build stronger gaming communities together.",
    "url": "https://communitypledges.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://communitypledges.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "CommunityPledges",
      "url": "https://communitypledges.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://communitypledges.com/logo.png"
      }
    }
  }

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className={inter.className}>
        <Providers>
          <NotificationProvider>
            <CurrencyProvider>
              <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex flex-col">
                <BatsProvider />
                <Navbar />
                <main className="container mx-auto px-4 py-8 flex-1">
                  {children}
                </main>
                <Footer />
                <NotificationContainer />
                <SessionDebug />
              </div>
            </CurrencyProvider>
          </NotificationProvider>
        </Providers>
      </body>
    </html>
  )
}

