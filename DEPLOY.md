# Deployment Instructions

## Backend Deployment

1. **Login to Vercel** (one-time):
   ```bash
   cd server
   vercel login
   ```
   - Visit the URL shown
   - Authorize the CLI

2. **Deploy to Production**:
   ```bash
   vercel --prod --yes
   ```
   - Copy the deployment URL (e.g., `https://matters-server-xxx.vercel.app`)

3. **Add Environment Variables** on Vercel Dashboard:
   - Go to: https://vercel.com/dashboard
   - Select your backend project
   - Settings → Environment Variables
   - Copy all variables from `server/.env.production`
   - Set them for **Production** environment
   - Redeploy after adding variables

## Frontend Deployment

1. **Update Environment Variables** on Vercel:
   - Go to your frontend project (matterz)
   - Settings → Environment Variables
   - Add for **Production**:
     ```
     VITE_API_URL=https://your-backend-url.vercel.app
     VITE_API_BASE_URL=/api
     ```

2. **Redeploy Frontend**:
   ```bash
   cd client
   vercel --prod --yes
   ```

## Quick Commands

```bash
# Deploy backend
cd server && vercel --prod --yes

# Deploy frontend
cd client && vercel --prod --yes
```

## After Deployment

Your app should be live at:
- Frontend: https://matterz.vercel.app
- Backend: https://your-backend-url.vercel.app

Test login with:
- Email: batham.tushar2001@gmail.com
- Password: yourpassword
