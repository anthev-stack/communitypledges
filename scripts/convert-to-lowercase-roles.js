const fs = require('fs')
const path = require('path')

// Files to update (from the previous script)
const filesToUpdate = [
  'app/api/admin/check-deposit-methods/route.ts',
  'app/api/admin/partner-streamers/route.ts',
  'app/api/admin/partner-streamers/[id]/route.ts',
  'app/api/staff/users/route.ts',
  'app/api/staff/transactions/route.ts',
  'app/api/staff/tickets/route.ts',
  'app/api/staff/stripe/route.ts',
  'app/api/staff/servers/route.ts',
  'app/api/staff/dashboard/route.ts',
  'app/api/staff/stripe/test/route.ts',
  'app/api/staff/banking/route.ts',
  'app/api/staff/servers/[id]/unban/route.ts',
  'app/api/staff/servers/[id]/ban/route.ts',
  'app/api/staff/tickets/[id]/status/route.ts',
  'app/api/staff/users/[id]/promote/route.ts',
  'app/api/staff/users/[id]/ban/route.ts',
  'app/api/staff/users/[id]/unban/route.ts',
  'app/api/tickets/[id]/messages/route.ts',
  'app/api/tickets/[id]/route.ts',
  'app/api/tickets/route.ts',
  'app/staff/tickets/page.tsx',
  'app/staff/users/page.tsx',
  'app/tickets/[id]/page.tsx',
  'components/Navbar.tsx',
  'app/members/page.tsx',
  'app/api/user/settings/profile-image/route.ts'
]

// Role mappings (uppercase to lowercase)
const roleMappings = [
  { from: "role !== 'ADMIN'", to: "role !== 'admin'" },
  { from: "role === 'ADMIN'", to: "role === 'admin'" },
  { from: "role !== 'MODERATOR'", to: "role !== 'moderator'" },
  { from: "role === 'MODERATOR'", to: "role === 'moderator'" },
  { from: "role !== 'USER'", to: "role !== 'user'" },
  { from: "role === 'USER'", to: "role === 'user'" },
  { from: "role !== 'PARTNER'", to: "role !== 'partner'" },
  { from: "role === 'PARTNER'", to: "role === 'partner'" },
  { from: "'ADMIN'", to: "'admin'" },
  { from: "'MODERATOR'", to: "'moderator'" },
  { from: "'USER'", to: "'user'" },
  { from: "'PARTNER'", to: "'partner'" }
]

function updateFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`)
      return
    }

    let content = fs.readFileSync(filePath, 'utf8')
    let updated = false

    // Apply role mappings
    for (const mapping of roleMappings) {
      const regex = new RegExp(mapping.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
      if (content.includes(mapping.from)) {
        content = content.replace(regex, mapping.to)
        updated = true
        console.log(`✅ Updated ${mapping.from} → ${mapping.to} in ${filePath}`)
      }
    }

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`🎉 Updated file: ${filePath}`)
    } else {
      console.log(`⚪ No changes needed: ${filePath}`)
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message)
  }
}

console.log('🔄 Converting all roles to lowercase...')

for (const file of filesToUpdate) {
  updateFile(file)
}

console.log('✅ Lowercase role conversion completed!')
