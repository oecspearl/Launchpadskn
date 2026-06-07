# Deploy to Heroku - Step by Step Guide

## Prerequisites
✅ You're logged in to Heroku CLI
✅ You have Heroku CLI installed
✅ Your app uses Supabase (no Java backend needed)

## Quick Deploy

### Option 1: Using Heroku CLI (Recommended)

```bash
# 1. Navigate to project root
cd "C:\Users\royst\Desktop\Personal Projects\ScholarSpace-Online-Learning-System-master"

# 2. Login to Heroku (if not already)
heroku login

# 3. Create Heroku app
heroku create launchpad-skn

# 4. Set environment variables
heroku config:set REACT_APP_SUPABASE_URL=https://zdcniidpqppwjyosooge.supabase.co
heroku config:set REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkY25paWRwcXBwd2p5b3Nvb2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODc3NDgsImV4cCI6MjA3NDQ2Mzc0OH0.nz9oqG27mtmGzso3uPAMFoj191Qr3dz03AKUS5anXuo

# 5. Set Node.js version (in frontend/package.json, add "engines")
# 6. Deploy
git init  # if not already a git repo
git add .
git commit -m "Initial commit for Heroku deployment"
git push heroku main

# Or if your branch is master:
git push heroku master
```

### Option 2: Using Heroku Dashboard

1. Go to https://dashboard.heroku.com/new
2. Click "New" > "Create new app"
3. Name: `launchpad-skn` (or your preferred name)
4. Choose region
5. Click "Create app"
6. Go to Settings > Config Vars
7. Add:
   - `REACT_APP_SUPABASE_URL` = `https://zdcniidpqppwjyosooge.supabase.co`
   - `REACT_APP_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
8. Go to Deploy tab
9. Connect to GitHub (if using) or use Heroku CLI

## Important Notes

1. **Buildpack**: The app.json specifies Node.js buildpack automatically
2. **Port**: Heroku sets PORT automatically - the Procfile uses it
3. **Static Files**: Uses `serve` to serve the React build
4. **Environment Variables**: Must be set in Heroku config

## After Deployment

Visit: `https://launchpad-skn.herokuapp.com` (or your app name)

## Troubleshooting

- If build fails: Check logs with `heroku logs --tail`
- If env vars missing: Verify with `heroku config`
- If port issues: Procfile should use `$PORT`

