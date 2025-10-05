// This script generates basic Open Graph images for social media sharing
// You can run this with: node scripts/generate-og-images.js

const fs = require('fs');
const path = require('path');

// Create a simple HTML template for OG images
const createOGImageHTML = (title, description, filename) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 1200px;
      height: 630px;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #064e3b 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .container {
      text-align: center;
      color: white;
      max-width: 1000px;
      padding: 40px;
    }
    .title {
      font-size: 72px;
      font-weight: bold;
      margin-bottom: 20px;
      text-shadow: 0 4px 8px rgba(0,0,0,0.3);
    }
    .description {
      font-size: 32px;
      color: #94a3b8;
      margin-bottom: 40px;
      line-height: 1.4;
    }
    .features {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      font-size: 24px;
      color: #10b981;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="title">${title}</div>
    <div class="description">${description}</div>
    <div class="features">
      <span>🎮</span>
      <span>Discord Servers</span>
      <span>💰</span>
      <span>Shared Costs</span>
      <span>🤝</span>
      <span>Community</span>
    </div>
  </div>
</body>
</html>
  `;
};

// Create OG image HTML files
const ogImages = [
  {
    title: 'CommunityPledges',
    description: 'Share server costs with your community',
    filename: 'og-image.html'
  },
  {
    title: 'Browse Servers',
    description: 'Discover Discord servers and gaming communities',
    filename: 'og-servers.html'
  },
  {
    title: 'Community Members',
    description: 'Meet the amazing people in our community',
    filename: 'og-members.html'
  }
];

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate HTML files for each OG image
ogImages.forEach(image => {
  const html = createOGImageHTML(image.title, image.description, image.filename);
  const filePath = path.join(publicDir, image.filename);
  fs.writeFileSync(filePath, html);
  console.log(`✅ Generated ${image.filename}`);
});

console.log('\n🎉 Open Graph image HTML files generated!');
console.log('\n📝 Next steps:');
console.log('1. Open each HTML file in a browser');
console.log('2. Take a screenshot at 1200x630 resolution');
console.log('3. Save as PNG files (og-image.png, og-servers.png, etc.)');
console.log('4. Place the PNG files in the /public directory');
console.log('\n💡 You can also use online tools like:');
console.log('- https://www.canva.com/');
console.log('- https://og-image.vercel.app/');
console.log('- https://www.photopea.com/');
