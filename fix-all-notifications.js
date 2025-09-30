const fs = require('fs');

// Files to fix
const files = [
  'app/servers/page.tsx',
  'app/tickets/[id]/page.tsx',
  'app/tickets/create/page.tsx'
];

files.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix notifications without titles - success
    content = content.replace(
      /addNotification\(\{\s*type:\s*'success',\s*message:\s*([^,}]+),/g,
      (match, message) => {
        return `addNotification({\n        type: 'success',\n        title: 'Success',\n        message: ${message},`;
      }
    );
    
    // Fix notifications without titles - error
    content = content.replace(
      /addNotification\(\{\s*type:\s*'error',\s*message:\s*([^,}]+),/g,
      (match, message) => {
        return `addNotification({\n        type: 'error',\n        title: 'Error',\n        message: ${message},`;
      }
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed notifications in ${filePath}`);
  }
});
