# Matters - Production Deployment Guide

This guide covers deploying Matters to **Vercel** (both frontend and backend).

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    PRODUCTION                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌──────────────┐         ┌──────────────────────┐   │
│   │   Frontend   │ ──────> │      Backend         │   │
│   │   (Vercel)   │         │     (Vercel)         │   │
│   │              │         │                      │   │
│   │ React + Vite │         │ Express.js + Node    │   │
│   └──────────────┘         └──────────┬───────────┘   │
│                                       │               │
│                                       ▼               │
│                            ┌──────────────────────┐   │
│                            │   MongoDB Atlas      │   │
│                            │   (Cloud Database)   │   │
│                            └──────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Atlas**: Create free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
3. **Node.js 18+**: Required for local development
4. **Vercel CLI**: `npm i -g vercel`

## Environment Setup

This project uses a **single `.env` file** at the root for both server and client.

Create `.env` at the project root with your values. The server and Vite client both load from this file.

## Step 1: Setup MongoDB Atlas

1. Create a free M0 cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a database user with read/write access
3. Add `0.0.0.0/0` to IP Access List (for Vercel serverless)
4. Get your connection string:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/matters?retryWrites=true&w=majority
   ```

## Step 2: Deploy Backend to Vercel

### 2.1 Login to Vercel CLI

```bash
vercel login
```

### 2.2 Deploy Backend

```bash
cd server
vercel --prod
```

When prompted:
- **Set up and deploy?** Yes
- **Which scope?** Select your account
- **Link to existing project?** No (first time) / Yes (subsequent)
- **Project name:** matters-api (or your choice)
- **Directory:** ./
- **Override settings?** No

### 2.3 Configure Environment Variables

Go to your backend project on [Vercel Dashboard](https://vercel.com/dashboard):

1. Select your backend project
2. Go to **Settings** → **Environment Variables**
3. Add the following variables for **Production**:

| Variable | Value | Required |
|----------|-------|----------|
| `NODE_ENV` | `production` | Yes |
| `MONGODB_URI` | Your MongoDB Atlas connection string | Yes |
| `JWT_SECRET` | Random 32+ char string | Yes |
| `JWT_ACCESS_SECRET` | Random 32+ char string | Yes |
| `JWT_REFRESH_SECRET` | Random 64+ char string | Yes |
| `CORS_ORIGIN` | `https://matterz.vercel.app` | Yes |
| `CLIENT_ORIGIN` | `https://matterz.vercel.app` | Yes |
| `FRONTEND_URL` | `https://matterz.vercel.app` | Yes |
| `EMAIL_USER` | Your Gmail address | For emails |
| `EMAIL_PASS` | Gmail App Password | For emails |
| `PUSHER_ENABLED` | `true` or `false` | Optional |
| `PUSHER_APP_ID` | Pusher App ID | If enabled |
| `PUSHER_KEY` | Pusher Key | If enabled |
| `PUSHER_SECRET` | Pusher Secret | If enabled |
| `PUSHER_CLUSTER` | Pusher Cluster (e.g., `mt1`) | If enabled |

### 2.4 Redeploy After Adding Variables

```bash
cd server
vercel --prod
```

Note your backend URL (e.g., `https://matters-api.vercel.app`)

## Step 3: Deploy Frontend to Vercel

### 3.1 Deploy Frontend

From the root directory:

```bash
vercel --prod
```

Or specifically from client:

```bash
cd client
vercel --prod
```

### 3.2 Configure Frontend Environment Variables

Go to your frontend project on Vercel Dashboard:

1. Select your frontend project
2. Go to **Settings** → **Environment Variables**
3. Add for **Production**:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://your-backend-url.vercel.app` |
| `VITE_API_BASE_URL` | `/api` |
| `VITE_PUSHER_ENABLED` | `true` or `false` |
| `VITE_PUSHER_KEY` | Your Pusher key (if enabled) |
| `VITE_PUSHER_CLUSTER` | `mt1` |

### 3.3 Redeploy Frontend

```bash
vercel --prod
```

## Step 4: Verify Deployment

### Check Backend Health

```bash
curl https://your-backend-url.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "service": "matters-server",
  "version": "1.0.0",
  "environment": "production"
}
```

### Check Frontend

Visit `https://matterz.vercel.app` (or your frontend URL)

## Quick Deploy Commands

```bash
# Deploy both (from root)
cd server && vercel --prod && cd ../client && vercel --prod

# Deploy backend only
cd server && vercel --prod

# Deploy frontend only
cd client && vercel --prod

# Or from root
vercel --prod
```

## Troubleshooting

### CORS Errors

Ensure `CORS_ORIGIN` in backend includes your frontend URL exactly.

### Database Connection Failed

1. Check MongoDB Atlas IP whitelist includes `0.0.0.0/0`
2. Verify connection string is correct
3. Check username/password in connection string

### 500 Errors on API

1. Check Vercel function logs: Dashboard → Project → Deployments → Functions
2. Verify all required environment variables are set
3. Check MongoDB connection

### Build Failures

```bash
# Check for TypeScript errors
cd client && npm run lint

# Check server starts locally
cd server && npm start
```

## Domain Configuration (Optional)

1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `CORS_ORIGIN` and `FRONTEND_URL` to use new domain

## Production Checklist

- [ ] MongoDB Atlas cluster created with user
- [ ] Backend deployed to Vercel
- [ ] Backend environment variables configured
- [ ] Frontend deployed to Vercel
- [ ] Frontend environment variables configured (VITE_API_URL)
- [ ] Health endpoint returns OK
- [ ] Login/Register works
- [ ] Email sending works (password reset)
- [ ] Real-time notifications work (if Pusher enabled)

## Support

- **Issues**: [GitHub Issues](https://github.com/Heisenberg1912/Matters/issues)
- **Frontend URL**: https://matterz.vercel.app
- **Health Check**: https://your-backend-url.vercel.app/api/health
