# Twitch Embed Domain Registration

## Issue
The Twitch embed is showing "This content is blocked. Contact the site owner to fix the issue."

## Solution
You need to register your domain with Twitch to allow embedding:

1. **Go to Twitch Developer Console**: https://dev.twitch.tv/console
2. **Select your application**: "Community Pledges Stream" (for embeds)
3. **Go to Settings tab**
4. **Add domain to "Allowed Origins"**:
   - Add: `https://communitypledges.com`
   - Add: `https://www.communitypledges.com` (if you use www)
5. **Save the changes**

## Alternative Solution
If you can't register the domain immediately, the component now has a fallback that shows a clickable thumbnail with a play button that opens Twitch directly.

## Current Status
- ✅ Dynamic hostname detection (works with both www and non-www)
- ✅ Fallback embed method (player.twitch.tv → embed.twitch.tv)
- ✅ Error handling and debugging added
- ✅ CSP headers updated to allow Twitch domains
- ⚠️ Still need to register domain with Twitch for full embed functionality

## Error Messages to Watch For
- `frame-ancestors` violations: Need to register exact domain with Twitch
- `404 favicon.ico`: Normal, can be ignored
- `Live streamer data: {isLive: true}`: Good! API is working, just embed issue

## Testing
1. Visit homepage
2. If embed fails → fallback thumbnail appears
3. Click play button → opens Twitch in new tab
4. After domain registration → embed should work automatically
