const mongoose = require('mongoose');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  email: String,
  name: String,
  googleId: String,
  avatar: String,
  accessLevel: { type: String, default: 'basic' },
  isActive: { type: Boolean, default: true },
  role: { type: String, default: 'parent' },
  grade: { type: String, default: '5' },
  activeKidProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'KidProfile', default: null },
  hasSetupKidProfiles: { type: Boolean, default: false },
  preferences: Object,
  stats: Object,
  subscription: Object,
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function updateExistingUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');

    // Find all users who don't have hasSetupKidProfiles field set
    const usersToUpdate = await User.find({
      $or: [
        { hasSetupKidProfiles: { $exists: false } },
        { hasSetupKidProfiles: null }
      ]
    });

    console.log(`Found ${usersToUpdate.length} users to update`);

    for (const user of usersToUpdate) {
      user.hasSetupKidProfiles = false;
      user.activeKidProfile = null;
      await user.save();
      console.log(`✅ Updated user: ${user.email}`);
    }

    // Also ensure all users have role = 'parent' (since they manage kids)
    const usersWithoutParentRole = await User.find({
      role: { $ne: 'parent' }
    });

    for (const user of usersWithoutParentRole) {
      user.role = 'parent';
      await user.save();
      console.log(`✅ Updated role for user: ${user.email}`);
    }

    console.log('\n📊 Summary:');
    console.log(`Updated hasSetupKidProfiles for ${usersToUpdate.length} users`);
    console.log(`Updated role for ${usersWithoutParentRole.length} users`);
    console.log('\n✅ All users updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the update
updateExistingUsers();