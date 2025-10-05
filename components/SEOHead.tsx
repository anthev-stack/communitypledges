import Head from 'next/head'

interface SEOHeadProps {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: string
  keywords?: string[]
  structuredData?: any
}

export default function SEOHead({
  title = 'CommunityPledges - Share Server Costs with Your Community',
  description = 'Join CommunityPledges to share server costs with your community. Discover Discord servers, pledge towards hosting costs, and build stronger gaming communities together.',
  image = '/og-image.png',
  url = 'https://communitypledges.com',
  type = 'website',
  keywords = [],
  structuredData
}: SEOHeadProps) {
  const fullTitle = title.includes('CommunityPledges') ? title : `${title} | CommunityPledges`
  
  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="CommunityPledges" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Structured Data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
    </Head>
  )
}
