const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function recreateAdmin() {
  try {
    console.log('🔄 Recreating admin account...');

    // Delete existing admin account
    const deletedAdmin = await prisma.user.deleteMany({
      where: { role: 'admin' }
    });
    
    if (deletedAdmin.count > 0) {
      console.log('🗑️ Deleted existing admin account');
    }

    // Create new admin account
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

    console.log('✅ Admin account recreated successfully!');
    console.log('📧 Email: admin@communitypledges.com');
    console.log('🔑 Password: admin123');
    console.log('🆔 ID:', admin.id);

    // Verify the account
    const testPassword = await bcrypt.compare('admin123', admin.password);
    console.log('🔐 Password verification:', testPassword ? '✅ Valid' : '❌ Invalid');

  } catch (error) {
    console.error('❌ Error recreating admin account:', error);
  } finally {
    await prisma.$disconnect();
  }
}

recreateAdmin();
