const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function hashExistingPasswords() {
  try {
    // Find all users
    const users = await prisma.user.findMany();

    for (const user of users) {
      // Skip if already hashed
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        console.log(`User ${user.email} already has a bcrypt hash`);
        continue;
      }

      // Hash the plain text password
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // Update user with hashed password
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });

      console.log(`Hashed password for user ${user.email}`);
    }

    console.log('Password hashing complete');
  } catch (error) {
    console.error('Error hashing passwords:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
hashExistingPasswords()
  .then(() => console.log('Done'))
  .catch(console.error);