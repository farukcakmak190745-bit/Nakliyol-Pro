# Nakliyol Pro - Deployment Guide

## Live Deployment to Vercel

### Option 1: Via Vercel Dashboard (Easiest)

1. Go to https://vercel.com/new
2. Import this repository: https://github.com/farukcakmak190745-bit/Nakliyol-Pro
3. Click "Deploy"
4. The app will be deployed automatically!

### Option 2: Via Command Line

#### Step 1: Login to Vercel
```bash
cd "C:\Users\PC\Desktop\nakliyol-pro"
npx vercel login
```
Visit the URL provided: https://vercel.com/oauth/device?user_code=LRTP-WCNL

#### Step 2: Deploy to Production
```bash
npx vercel --prod
```

## Environment Variables

Make sure these variables are set in Vercel (Project Settings → Environment Variables):

```
VITE_SUPABASE_URL=https://wkxhgrqxknxchferqqha.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndreGhncnF4a254Y2hmZXJxcWhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjI4ODcsImV4cCI6MjA5MzczODg4N30.PObDf90tsIOZhsXtwIFOgODEsjXLVZ0DNgYZ8vrPTQQ
```

## Or Build and Deploy Manually

### Build Production Version
```bash
cd "C:\Users\PC\Desktop\nakliyol-pro"
npm run build
```

### Deploy to Any Static Hosting
- Upload the `build/` folder to:
  - Netlify Drop: https://app.netlify.com/drop
  - Vercel CLI: `npx vercel --prod`
  - GitHub Pages
  - AWS S3 + CloudFront
  - Any static hosting service

## Current Status

✅ Code pushed to GitHub: https://github.com/farukcakmak190745-bit/Nakliyol-Pro
✅ Production build completed successfully
⏳ Ready to deploy to Vercel

## Access URL (After Deployment)

After deploying, your app will be available at:
```
https://nakliyol-pro.vercel.app
```

Or your custom domain if configured.

---

**Last Updated:** 2026-05-12
**Commit:** f67c2fcd - Fix authentication system integration
