// Run this script with:
// node -r dotenv/config scripts/test-auth.js dotenv_config_path=.env.local

const { verifyPassword, hashPassword } = require('../lib/auth');
const bcrypt = require('bcryptjs');

// Test function for password verification
async function testPasswordVerification() {
  console.log('Testing password verification...');
  
  // Create a test password and hash it
  const testPassword = 'SecurePassword123';
  
  // Hash with bcrypt directly to ensure it's working
  console.log('Hashing password with bcrypt...');
  const bcryptHash = await bcrypt.hash(testPassword, 10);
  console.log('Bcrypt hash:', bcryptHash);
  
  // Test direct verification
  console.log('Testing direct bcrypt verification...');
  const directVerify = await bcrypt.compare(testPassword, bcryptHash);
  console.log('Direct verification result:', directVerify);
  
  // Test with wrong password
  console.log('Testing direct bcrypt with wrong password...');
  const directWrong = await bcrypt.compare('WrongPassword123', bcryptHash);
  console.log('Direct wrong password result:', directWrong);
  
  // Test our wrapper functions
  console.log('\nTesting our authentication wrapper functions...');
  console.log('Hashing password with our function...');
  const ourHash = await hashPassword(testPassword);
  console.log('Our hash function result:', ourHash);
  
  // Test our verify function
  console.log('Testing our verify function with correct password...');
  const ourVerify = await verifyPassword(testPassword, ourHash);
  console.log('Our verification result:', ourVerify);
  
  // Test our verify function with wrong password
  console.log('Testing our verify function with wrong password...');
  const ourWrong = await verifyPassword('WrongPassword123', ourHash);
  console.log('Our wrong password result:', ourWrong);
  
  return {
    bcryptWorking: directVerify === true && directWrong === false,
    ourFunctionsWorking: ourVerify === true && ourWrong === false
  };
}

// Run the test
testPasswordVerification()
  .then(result => {
    console.log('\nTest results:');
    console.log('Bcrypt working:', result.bcryptWorking ? '✅ Yes' : '❌ No');
    console.log('Our functions working:', result.ourFunctionsWorking ? '✅ Yes' : '❌ No');
    
    if (!result.bcryptWorking) {
      console.log('\n⚠️ bcrypt is not working correctly. This might indicate an installation problem.');
      console.log('Try reinstalling bcryptjs: npm uninstall bcryptjs && npm install bcryptjs');
    }
    
    if (!result.ourFunctionsWorking) {
      console.log('\n⚠️ Your authentication wrapper functions are not working correctly.');
      console.log('Check the implementation in lib/auth.js');
    }
    
    if (result.bcryptWorking && result.ourFunctionsWorking) {
      console.log('\n✅ Password verification is working correctly!');
    }
  })
  .catch(error => {
    console.error('Test failed with error:', error);
  });