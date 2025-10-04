const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    console.log('🔍 Checking admin account...');

    // Find admin account
    const admin = await prisma.user.findFirst({
      where: { role: 'admin' }
    });

    if (!admin) {
      console.log('❌ No admin account found');
      console.log('💡 Run: npm run seed-admin');
      return;
    }

    console.log('✅ Admin account found:');
    console.log('📧 Email:', admin.email);
    console.log('👤 Name:', admin.name);
    console.log('🔐 Role:', admin.role);
    console.log('📅 Email Verified:', admin.emailVerified);
    console.log('🖼️ Image:', admin.image);
    console.log('🔑 Has Password:', !!admin.password);

    // Test password
    if (admin.password) {
      const isPasswordValid = await bcrypt.compare('admin123', admin.password);
      console.log('🔐 Password "admin123" valid:', isPasswordValid);
      
      if (!isPasswordValid) {
        console.log('⚠️ Password might be different or corrupted');
      }
    }

    // Check if there are any other users
    const userCount = await prisma.user.count();
    console.log('👥 Total users in database:', userCount);

  } catch (error) {
    console.error('❌ Error checking admin account:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
