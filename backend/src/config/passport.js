const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // Update last login
          user.lastLogin = new Date();
          await user.save();
          return done(null, user);
        }

        // Check if user exists with same email
        user = await User.findOne({ email: profile.emails[0].value });
        
        if (user) {
          // Link Google account to existing user
          user.googleId = profile.id;
          user.authProvider = 'google';
          user.avatar = profile.photos[0]?.value;
          user.lastLogin = new Date();
          await user.save();
          return done(null, user);
        }

        // Create new user
        const username = profile.emails[0].value.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
        
        // Ensure unique username
        let finalUsername = username;
        let counter = 1;
        while (await User.findOne({ username: finalUsername })) {
          finalUsername = `${username}${counter}`;
          counter++;
        }

        user = await User.create({
          googleId: profile.id,
          username: finalUsername,
          name: profile.displayName,
          email: profile.emails[0].value,
          avatar: profile.photos[0]?.value,
          authProvider: 'google',
          role: 'student', // Default role
          grade: '5', // Default grade for Google users
          lastLogin: new Date()
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;