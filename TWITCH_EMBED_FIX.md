# Twitch Embed Domain Registration

## Issue
The Twitch embed is showing "This content is blocked. Contact the site owner to fix the issue."

## Solution
You need to register your domain with Twitch to allow embedding:

1. **Go to Twitch Developer Console**: https://dev.twitch.tv/console
2. **Select your application**: "Community Pledges"
3. **Go to Settings tab**
4. **Add domain to "Allowed Origins"**:
   - Add: `https://communitypledges.com`
   - Add: `https://www.communitypledges.com` (if you use www)
5. **Save the changes**

## Alternative Solution
If you can't register the domain immediately, the component now has a fallback that shows a clickable thumbnail with a play button that opens Twitch directly.

## Current Status
- ✅ Fallback implemented (shows thumbnail + play button)
- ✅ Error handling added
- ⚠️ Still need to register domain with Twitch for full embed functionality

## Testing
1. Visit homepage
2. If embed fails → fallback thumbnail appears
3. Click play button → opens Twitch in new tab
4. After domain registration → embed should work automatically
