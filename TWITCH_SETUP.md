# Twitch Integration Setup

To enable the live stream embed feature, you need to set up Twitch API credentials.

## 1. Create a Twitch Application

1. Go to [Twitch Developer Console](https://dev.twitch.tv/console)
2. Sign in with your Twitch account
3. Click "Create" to create a new application
4. Fill in the application details:
   - **Name**: Community Pledges
   - **OAuth Redirect URLs**: `http://localhost:3000` (for development)
   - **Category**: Website
5. Click "Create"
6. Copy your **Client ID** and **Client Secret**

## 2. Environment Variables

Add these environment variables to your `.env.local` file:

```env
# Twitch Integration
TWITCH_CLIENT_ID="your-twitch-client-id"
TWITCH_CLIENT_SECRET="your-twitch-client-secret"
```

## 3. Features

The Twitch integration provides:

- ✅ **Live Stream Detection**: Automatically checks if streamers are live
- ✅ **Real-time Updates**: Refreshes every 30 seconds when live
- ✅ **Stream Information**: Shows title, game, viewer count, duration
- ✅ **Partner Branding**: Custom "Community Pledges Partner" badge
- ✅ **Responsive Design**: Works on all screen sizes
- ✅ **Direct Links**: Click to watch on Twitch

## 4. Usage

Add the component to any page:

```tsx
import LiveStreamEmbed from '@/components/LiveStreamEmbed'

// In your component
<LiveStreamEmbed username="hrry" />
```

## 5. Testing

Test with the hrry account:
- Component will only show when @hrry is live on Twitch
- Automatically hides when stream goes offline
- Shows live viewer count and stream duration

## 6. Customization

The component includes:
- Custom purple/pink gradient styling
- Animated live indicator
- Partner badge
- Stream thumbnail with play button overlay
- Direct links to Twitch
