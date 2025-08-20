const mongoose = require('mongoose');
const AllowedEmail = require('../src/models/AllowedEmail');
require('dotenv').config();

async function setupAdminEmails() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Admin emails to add
    const adminEmails = [
      'writetoasik@gmail.com',
      'itsmeasik@gmail.com',
      'writetonikkath@gmail.com'
    ];

    for (const email of adminEmails) {
      try {
        const existingEmail = await AllowedEmail.findOne({ email: email.toLowerCase() });
        
        if (existingEmail) {
          console.log(`${email} already exists`);
          continue;
        }

        const allowedEmail = new AllowedEmail({
          email: email.toLowerCase(),
          domain: email.toLowerCase().split('@')[1],
          accessLevel: 'admin',
          isOverrideEmail: true,
          addedBy: null, // System added
          notes: 'Initial admin setup - Full access'
        });
        
        await allowedEmail.save();
        console.log(`✅ Added ${email} as admin`);
      } catch (error) {
        console.error(`❌ Error adding ${email}:`, error.message);
      }
    }

    console.log('\n🎉 Admin setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

setupAdminEmails();