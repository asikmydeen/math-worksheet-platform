const mongoose = require('mongoose');
require('dotenv').config();

async function addTestEmail() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const AllowedEmail = require('../src/models/AllowedEmail');
    
    const email = process.env.TEST_EMAIL || 'asikmydeen@gmail.com';
    
    const result = await AllowedEmail.findOneAndUpdate(
      { email },
      { 
        email,
        accessLevel: 'premium',
        reason: 'Platform owner - testing payment flow'
      },
      { upsert: true, new: true }
    );
    
    console.log('Successfully added email:', result.email);
    console.log('Access level:', result.accessLevel);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addTestEmail();