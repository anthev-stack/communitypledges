const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function ensureAdmin() {
  try {
    console.log('🔍 Ensuring admin account exists...');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'admin' }
    });

    if (existingAdmin) {
      console.log('✅ Admin account already exists:', existingAdmin.email);
      return;
    }

    console.log('🔧 Creating admin account...');

    // Create default admin account
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@communitypledges.com',
        password: hashedPassword,
        role: 'admin',
        emailVerified: new Date(),
        image: '/default-avatar.png'
      }
    });

    console.log('✅ Admin account created successfully!');
    console.log('📧 Email: admin@communitypledges.com');
    console.log('🔑 Password: admin123');
    console.log('🆔 ID:', admin.id);

  } catch (error) {
    console.error('❌ Error ensuring admin account:', error);
    // Don't fail the build if admin creation fails
    console.log('⚠️ Continuing build without admin account...');
  } finally {
    await prisma.$disconnect();
  }
}

ensureAdmin();