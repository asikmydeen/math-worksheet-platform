# Google OAuth Setup Guide

## Prerequisites
Before you can use Google login, you need to set up OAuth credentials in Google Cloud Console.

## Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API for your project

## Step 2: Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen first:
   - Choose "External" for user type
   - Fill in the required fields (app name, user support email, etc.)
   - Add your domain to authorized domains
   - Save and continue

4. For Application type, select "Web application"
5. Add the following:
   - **Authorized JavaScript origins:**
     - `http://localhost:80`
     - `http://localhost:3000` (for development)
     - `http://10.0.0.181` (your local network IP)
     - Your production domain
   
   - **Authorized redirect URIs:**
     - `http://localhost:5001/api/auth/google/callback`
     - `http://10.0.0.181:5001/api/auth/google/callback`
     - Your production domain + `/api/auth/google/callback`

6. Click "Create"
7. Copy the Client ID and Client Secret

## Step 3: Update Environment Variables
Add these to your `backend/.env` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
SESSION_SECRET=generate-a-random-string-here
```

## Step 4: Update Frontend URL
Make sure the `FRONTEND_URL` in your backend `.env` matches your setup:

```env
FRONTEND_URL=http://10.0.0.181
```

## Step 5: Rebuild and Restart
```bash
# Stop containers
docker-compose down

# Rebuild with new packages
docker-compose up -d --build
```

## How It Works
1. User clicks "Sign in with Google" button
2. They're redirected to Google's OAuth consent page
3. After authorization, Google redirects back to your app with a code
4. Backend exchanges the code for user information
5. A new user account is created (or existing one is found)
6. JWT token is generated and user is logged in
7. No 2FA setup required for Google users!

## Security Notes
- Google users don't need 2FA since Google handles authentication
- Users can link existing accounts by using the same email
- Usernames are auto-generated from email addresses
- Keep your Client Secret secure and never commit it to git

## Troubleshooting
- **Error: redirect_uri_mismatch**: Make sure your redirect URIs in Google Console exactly match your setup
- **Connection refused**: Ensure your backend URL is accessible from your browser
- **CORS errors**: Check that your frontend URL is properly configured in the backend

## Testing
1. Click "Sign in with Google" on the login page
2. Select your Google account
3. You should be redirected to the dashboard
4. Check that your name and email appear correctly