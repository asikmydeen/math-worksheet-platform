const mongoose = require('mongoose');
require('dotenv').config();

async function fixUserIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // List all indexes
    const indexes = await collection.listIndexes().toArray();
    console.log('\nCurrent indexes:');
    indexes.forEach(index => {
      console.log(`- ${index.name}:`, index.key);
    });

    // Drop the problematic username index if it exists
    const usernameIndex = indexes.find(index => index.key.username);
    if (usernameIndex) {
      console.log('\n❌ Found problematic username index, dropping it...');
      await collection.dropIndex('username_1');
      console.log('✅ Dropped username_1 index');
    } else {
      console.log('\n✅ No problematic username index found');
    }

    // Ensure we have the correct indexes
    console.log('\n📝 Creating correct indexes...');
    
    // Create the indexes we actually need
    await collection.createIndex({ email: 1 }, { unique: true });
    await collection.createIndex({ googleId: 1 }, { unique: true });
    await collection.createIndex({ createdAt: -1 });
    await collection.createIndex({ accessLevel: 1 });
    await collection.createIndex({ isActive: 1 });
    
    console.log('✅ Created correct indexes');

    // List indexes again to confirm
    const newIndexes = await collection.listIndexes().toArray();
    console.log('\nNew indexes:');
    newIndexes.forEach(index => {
      console.log(`- ${index.name}:`, index.key);
    });

    console.log('\n✅ Index fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the fix
fixUserIndexes();