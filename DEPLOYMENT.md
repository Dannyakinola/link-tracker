# Deployment Guide

## ⚠️ IMPORTANT: Remove Sensitive Files from Git

Your `.env` files were committed to the repository. Before deploying, you MUST remove them from git history:

```bash
# Remove .env files from git but keep locally
git rm --cached Backend/.env
git rm --cached Frontend/.env
git rm --cached Frontend/.env.productions.conf

# Commit the removal
git commit -m "Remove sensitive env files from git"
```

## Backend Deployment (Render)

1. **Push to GitHub** (already done)

2. **Go to [Render](https://render.com)**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `Dannyakinola/link-tracker`
   - Configure:
     - **Name**: `link-tracker-backend`
     - **Root Directory**: `Backend`
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `node server.js`

3. **Add Environment Variables** in Render dashboard:
   ```
   NODE_ENV=production
   PORT=3000
   FRONTEND_URL=https://your-frontend-url.vercel.app
   SUPABASE_URL=https://yrmmngsecvhhpeynnaefg.supabase.co
   SUPABASE_SERVICE_KEY=<your_service_key_from_local_env>
   JWT_SECRET=373f6358745096204bf25278c6edea66294f5156edea6a267dbbb2e2a1f63741
   ```

4. **Deploy** - Render will auto-deploy

5. **Copy your Render URL** (e.g., `https://link-tracker-backend.onrender.com`)

## Frontend Deployment (Vercel)

1. **Go to [Vercel](https://vercel.com)**
   - Click "Add New" → "Project"
   - Import your GitHub repository: `Dannyakinola/link-tracker`
   - Configure:
     - **Framework Preset**: Create React App
     - **Root Directory**: `Frontend`
     - **Build Command**: `npm run build` (or leave default)
     - **Output Directory**: `build` (or leave default)

2. **Add Environment Variables** in Vercel dashboard:
   ```
   REACT_APP_API_URL=https://your-render-backend-url.onrender.com/api
   REACT_APP_SUPABASE_URL=https://yrmmngsecvhhpeynnaefg.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=<your_anon_key_from_local_env>
   ```
   
   **⚠️ IMPORTANT**: Make sure `REACT_APP_API_URL` ends with `/api`!

3. **Deploy** - Vercel will auto-deploy

4. **Update Backend CORS**:
   - Go back to Render dashboard
   - Update `FRONTEND_URL` to your actual Vercel URL
   - Trigger a redeploy

## Post-Deployment Checklist

- [ ] Remove `.env` files from git history
- [ ] Backend deployed on Render
- [ ] Frontend deployed on Vercel
- [ ] Environment variables set correctly on both platforms
- [ ] `FRONTEND_URL` in Render matches your Vercel URL
- [ ] `REACT_APP_API_URL` in Vercel points to your Render URL + `/api`
- [ ] Test creating a link
- [ ] Test link redirection
- [ ] Test analytics

## Security Notes

- **NEVER** commit `.env` files to git
- Use `.env.example` files as templates
- Rotate your JWT_SECRET regularly
- Keep Supabase service key secret
- Enable Render's auto-deploy from GitHub for continuous deployment
