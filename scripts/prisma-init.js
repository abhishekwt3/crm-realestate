// This script can be run to initialize Prisma and test the database connection
const { PrismaClient } = require('@prisma/client');

async function main() {
  console.log('Testing Prisma database connection...');
  
  try {
    const prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
    
    // Test connection by getting count of organizations
    const count = await prisma.organisation.count();
    console.log(`Connection successful! Found ${count} organizations.`);
    
    await prisma.$disconnect();
    
    return { success: true, message: 'Database connection test successful' };
  } catch (error) {
    console.error('Database connection test failed:');
    console.error(error);
    
    return {
      success: false,
      message: 'Database connection test failed',
      error: error.message
    };
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  main()
    .then(result => {
      console.log(result.message);
      if (!result.success) {
        process.exit(1);
      }
    })
    .catch(e => {
      console.error('Script error:', e);
      process.exit(1);
    });
}

module.exports = { testConnection: main };