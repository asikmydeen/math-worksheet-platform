# Debug Admin Setup

If the setup URL still doesn't work, you can manually add the admin emails to the database.

## Option 1: SSH into AWS and run the script
```bash
# SSH into your AWS instance
ssh -i your-key.pem ubuntu@your-aws-ip

# Navigate to the project
cd ~/math-worksheet-platform/backend

# Run the initialization script
node scripts/init-admin-emails.js
```

## Option 2: Add a debug endpoint
Add this temporary route to see what the JWT_SECRET is:

```javascript
// Add to authRoutes.js (REMOVE after setup!)
router.get('/debug-secret', (req, res) => {
  res.json({
    hasAdminSecret: !!process.env.ADMIN_SETUP_SECRET,
    hasJwtSecret: !!process.env.JWT_SECRET,
    jwtSecretLength: process.env.JWT_SECRET?.length || 0
  });
});
```

## Option 3: Use MongoDB directly
Connect to your MongoDB instance and run:
```javascript
db.allowedemails.insertMany([
  {
    email: "writetoasik@gmail.com",
    domain: "gmail.com", 
    accessLevel: "admin",
    isActive: true,
    isOverrideEmail: true,
    notes: "Manual admin setup",
    loginCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    email: "itsmeasik@gmail.com",
    domain: "gmail.com",
    accessLevel: "admin", 
    isActive: true,
    isOverrideEmail: true,
    notes: "Manual admin setup",
    loginCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    email: "writetonikkath@gmail.com",
    domain: "gmail.com",
    accessLevel: "admin",
    isActive: true, 
    isOverrideEmail: true,
    notes: "Manual admin setup",
    loginCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);
```