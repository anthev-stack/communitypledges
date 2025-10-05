interface ServerStructuredDataProps {
  server: {
    id: string
    name: string
    description: string
    category: string
    memberCount: number
    monthlyCost: number
    currency: string
    region: string
    inviteUrl?: string
    createdAt: Date
    updatedAt: Date
  }
}

export default function ServerStructuredData({ server }: ServerStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": server.name,
    "description": server.description,
    "applicationCategory": "GameApplication",
    "operatingSystem": "Discord",
    "offers": {
      "@type": "Offer",
      "price": server.monthlyCost,
      "priceCurrency": server.currency,
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": server.monthlyCost,
        "priceCurrency": server.currency,
        "unitText": "monthly"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.5",
      "ratingCount": server.memberCount,
      "bestRating": "5",
      "worstRating": "1"
    },
    "author": {
      "@type": "Organization",
      "name": "CommunityPledges"
    },
    "dateCreated": server.createdAt.toISOString(),
    "dateModified": server.updatedAt.toISOString(),
    "url": `https://communitypledges.com/servers/${server.id}`,
    "sameAs": server.inviteUrl
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
