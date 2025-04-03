// Run this script to update existing plain-text passwords to hashed ones
// Execute using: node scripts/hash-passwords.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const BCRYPT_SALT_ROUNDS = 10;

async function hashExistingPasswords() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Fetching users...');
    
    // Get all users from database
    const users = await prisma.user.findMany();
    
    console.log(`Found ${users.length} users`);
    
    // Counter for updated users
    let updateCount = 0;
    
    // Process each user
    for (const user of users) {
      // Skip if password already looks like bcrypt hash (starts with $2a$ or $2b$)
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        console.log(`User ${user.id} (${user.email}) already has hashed password`);
        continue;
      }
      
      // Hash the current password
      const hashedPassword = await bcrypt.hash(user.password, BCRYPT_SALT_ROUNDS);
      
      // Update the user with the hashed password
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });
      
      console.log(`Updated password for user ${user.id} (${user.email})`);
      updateCount++;
    }
    
    console.log(`\nPassword update complete. Updated ${updateCount} users.`);
    
  } catch (error) {
    console.error('Error updating passwords:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the function
hashExistingPasswords()
  .then(() => console.log('Done'))
  .catch(err => console.error('Script error:', err));