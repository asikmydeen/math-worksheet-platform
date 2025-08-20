const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/models/User');
const KidProfile = require('../src/models/KidProfile');

async function debugUserSetup() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');

    const users = await User.find({}).select('email name hasSetupKidProfiles activeKidProfile role');
    
    console.log('\n📋 All Users:');
    console.log('='.repeat(80));
    
    users.forEach(user => {
      console.log(`📧 Email: ${user.email}`);
      console.log(`👤 Name: ${user.name}`);
      console.log(`🔧 Role: ${user.role}`);
      console.log(`👶 hasSetupKidProfiles: ${user.hasSetupKidProfiles}`);
      console.log(`🎯 activeKidProfile: ${user.activeKidProfile || 'null'}`);
      console.log(`❓ Should show setup?: ${!user.hasSetupKidProfiles ? 'YES' : 'NO'}`);
      console.log('-'.repeat(50));
    });

    // Let's also check what the /me endpoint would return
    for (const user of users) {
      const populatedUser = await User.findById(user._id).populate('activeKidProfile');
      console.log(`\n🔍 /me response for ${user.email}:`);
      console.log({
        hasSetupKidProfiles: populatedUser.hasSetupKidProfiles,
        activeKidProfile: populatedUser.activeKidProfile,
        role: populatedUser.role
      });
    }

    console.log('\n✅ Debug complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

debugUserSetup();