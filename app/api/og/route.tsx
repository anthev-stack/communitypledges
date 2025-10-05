import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get('title') || 'CommunityPledges'
    const description = searchParams.get('description') || 'Share server costs with your community'

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #064e3b 100%)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              textAlign: 'center',
              maxWidth: '1000px',
            }}
          >
            <div
              style={{
                fontSize: '72px',
                fontWeight: 'bold',
                color: '#ffffff',
                marginBottom: '20px',
                textShadow: '0 4px 8px rgba(0,0,0,0.3)',
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: '32px',
                color: '#94a3b8',
                marginBottom: '40px',
                lineHeight: '1.4',
              }}
            >
              {description}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                fontSize: '24px',
                color: '#10b981',
                fontWeight: '600',
              }}
            >
              <div>🎮</div>
              <div>Discord Servers</div>
              <div>💰</div>
              <div>Shared Costs</div>
              <div>🤝</div>
              <div>Community</div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e: any) {
    console.log(`${e.message}`)
    return new Response(`Failed to generate the image`, {
      status: 500,
    })
  }
}
