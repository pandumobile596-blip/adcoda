# AdCoda Deployment Guide 🚀

This guide will walk you through deploying **AdCoda** to production using popular hosting platforms.

## 📋 Deployment Checklist

Before deploying, ensure you have:

- ✅ Supabase project set up with the `swipes` table and storage bucket
- ✅ Google Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
- ✅ All environment variables documented
- ✅ Code pushed to a Git repository (GitHub, GitLab, etc.)

---

## 🗄️ Database & Storage (Supabase)

Supabase hosts your PostgreSQL database, authentication, and file storage. It's already production-ready!

### Setup Steps:

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com/dashboard)
   - Click **"New Project"**
   - Choose a name, database password, and region

2. **Create the Storage Bucket**
   - Navigate to **Storage** → **New Bucket**
   - Name: `swipes`
   - **Make it Public** (required for image URLs)

3. **Run the SQL Setup Script**
   - Go to **SQL Editor** → **New Query**
   - Copy the SQL script from the README or `/app/memory/PRD.md`
   - Click **Run**

4. **Get Your Credentials**
   - Go to **Settings** → **API**
   - Copy your:
     - `Project URL` → `VITE_SUPABASE_URL`
     - `anon public` key → `VITE_SUPABASE_ANON_KEY`

5. **(Optional) Disable Email Confirmation**
   - **Authentication** → **Settings** → **Email Auth**
   - Toggle off **"Confirm email"** for easier testing

---

## 🖥️ Backend Deployment

The FastAPI backend can be deployed to **Railway**, **Render**, or **Heroku**.

### Option 1: Railway (Recommended)

Railway offers a generous free tier and automatic deployments from Git.

#### Steps:

1. **Sign up at [railway.app](https://railway.app)**
2. **Create a New Project** → **Deploy from GitHub repo**
3. **Select your repository** and choose the `backend` folder as the root
4. **Set Environment Variables** in Railway dashboard:
   ```
   GOOGLE_API_KEY=your-google-gemini-api-key
   ```

5. **Configure Build & Start Commands**:
   - **Build Command**: (leave empty, Railway auto-detects Python)
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`

6. **Deploy** and copy your backend URL (e.g., `https://your-app.railway.app`)

---

### Option 2: Render

Render is another great option with automatic HTTPS and free tier.

#### Steps:

1. **Sign up at [render.com](https://render.com)**
2. **New** → **Web Service**
3. **Connect your Git repository**
4. **Configure**:
   - **Name**: `adcoda-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`

5. **Environment Variables**:
   ```
   GOOGLE_API_KEY=your-google-gemini-api-key
   ```

6. **Create Web Service** and copy your backend URL

---

### Option 3: Heroku

#### Steps:

1. **Install the Heroku CLI** and log in:
   ```bash
   heroku login
   ```

2. **Create a new Heroku app**:
   ```bash
   cd backend
   heroku create adcoda-backend
   ```

3. **Add a `Procfile`** in the `backend/` directory:
   ```
   web: uvicorn server:app --host 0.0.0.0 --port $PORT
   ```

4. **Set environment variables**:
   ```bash
   heroku config:set GOOGLE_API_KEY=your-google-gemini-api-key
   ```

5. **Deploy**:
   ```bash
   git subtree push --prefix backend heroku main
   ```

6. **Open your app**:
   ```bash
   heroku open
   ```

---

## 🌐 Frontend Deployment

The React + Vite frontend can be deployed to **Vercel**, **Netlify**, or **Cloudflare Pages**.

### Option 1: Vercel (Recommended)

Vercel is built for React apps and offers seamless deployment.

#### Steps:

1. **Sign up at [vercel.com](https://vercel.com)**
2. **Import your Git repository**
3. **Configure the project**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `yarn build`
   - **Output Directory**: `build`

4. **Set Environment Variables** in Vercel dashboard:
   ```
   VITE_BACKEND_URL=https://your-backend-url.railway.app
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

5. **Deploy** and Vercel will give you a live URL (e.g., `https://adcoda.vercel.app`)

---

### Option 2: Netlify

Netlify is another excellent choice for frontend hosting.

#### Steps:

1. **Sign up at [netlify.com](https://netlify.com)**
2. **New site from Git** → Connect your repository
3. **Configure build settings**:
   - **Base directory**: `frontend`
   - **Build command**: `yarn build`
   - **Publish directory**: `frontend/build`

4. **Environment Variables**:
   - Go to **Site settings** → **Environment variables**
   - Add:
     ```
     VITE_BACKEND_URL=https://your-backend-url.railway.app
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
     ```

5. **Deploy** and get your live URL

---

### Option 3: Cloudflare Pages

#### Steps:

1. **Sign up at [pages.cloudflare.com](https://pages.cloudflare.com)**
2. **Create a project** → Connect to Git
3. **Build Configuration**:
   - **Build command**: `cd frontend && yarn build`
   - **Build output directory**: `frontend/build`

4. **Environment Variables**:
   ```
   VITE_BACKEND_URL=https://your-backend-url.railway.app
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

5. **Deploy**

---

## 🔐 Environment Variables Summary

### Frontend (`.env` in `frontend/` directory)

```bash
VITE_BACKEND_URL=https://your-backend-url.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Backend (`.env` in `backend/` directory)

```bash
GOOGLE_API_KEY=your-google-gemini-api-key
```

> **Note**: When deploying, set these in your hosting platform's dashboard, **NOT** in the `.env` file (which should not be committed to Git).

---

## 🧪 Testing Your Deployment

After deploying, test the following:

1. ✅ **Sign Up / Sign In** - Create a test account
2. ✅ **Upload an Image** - Test the file upload and AI analysis
3. ✅ **View Swipes** - Ensure the dashboard loads swipes correctly
4. ✅ **Search & Filter** - Test search and category filtering
5. ✅ **Delete a Swipe** - Verify deletion works
6. ✅ **Demo Mode** - Visit `https://your-frontend-url.com?demo=true`

---

## 🐛 Troubleshooting

### Issue: "CORS Error" when uploading images

**Solution**: Ensure your backend URL is correctly set in `VITE_BACKEND_URL` and that your FastAPI backend has CORS enabled:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this in production to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### Issue: "Supabase credentials missing"

**Solution**: Double-check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in your frontend hosting platform's environment variables.

---

### Issue: Backend fails to start

**Solution**: Check your backend logs for errors. Common issues:
- Missing `GOOGLE_API_KEY` environment variable
- Incorrect `uvicorn` start command (should include `--host 0.0.0.0 --port $PORT`)

---

## 📊 Monitoring & Scaling

- **Supabase**: Monitor database usage in the Supabase dashboard
- **Railway/Render**: Check logs and metrics in your hosting dashboard
- **Vercel/Netlify**: View analytics and build logs in their respective dashboards

---

## 🎉 You're Live!

Congratulations! Your AdCoda app is now deployed and accessible to users worldwide. 🌍

For support or questions, please open an issue on GitHub.

---

**Happy deploying! 🚀**
