# SwipeFlow — Product Requirements Document

## Overview
SwipeFlow is a Micro-SaaS marketing swipe file manager with Gemini AI-powered image analysis.
Users upload marketing materials (ads, emails, landing pages) and get instant AI extraction of:
- Marketing formula (AIDA, PAS, BAB, FAB, etc.)
- Industry & emotional hook tagging
- OCR text extraction

## Tech Stack
- **Frontend**: React 19, Tailwind CSS, Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: Google Gemini 2.5 Flash (via google-genai SDK)
- **Design**: Dark mode, Space Grotesk + Inter fonts, Indigo primary

## Features Implemented
1. **Auth**: Supabase email/password auth with robust error handling
2. **Dashboard**: Masonry grid swipe library with search, sort, filter
3. **AI Upload Flow**: Supabase Storage → Gemini API → structured analysis
4. **Formula Badges**: Color-coded AIDA/PAS/BAB/FAB/PPPP/4Ps
5. **Freemium**: 15-upload free limit with Pro upgrade modal ($12/mo)
6. **Stats Cards**: Total swipes, formulas found, industries, free slots
7. **Detail Modal**: Full AI analysis view per swipe
8. **Demo Mode**: `?demo=true` shows dashboard with mock data

## Environment Variables
### Frontend (.env)
- `REACT_APP_BACKEND_URL` — FastAPI backend URL
- `REACT_APP_SUPABASE_URL` — Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY` — Supabase anon key

### Backend (.env)
- `MONGO_URL` — MongoDB connection (existing)
- `DB_NAME` — MongoDB database name
- `GEMINI_API_KEY` — Google Gemini API key

## Supabase Setup Required
1. Run SQL in Supabase SQL Editor:
```sql
CREATE TABLE public.swipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  file_path TEXT,
  extracted_text TEXT,
  marketing_formula TEXT,
  industry TEXT,
  emotional_hook TEXT,
  category TEXT,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own swipes" ON public.swipes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own swipes" ON public.swipes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own swipes" ON public.swipes FOR DELETE USING (auth.uid() = user_id);
```
2. Create `swipes` storage bucket (public) in Supabase dashboard
3. Optionally disable email confirmation (Authentication → Settings) for easier testing

## API Endpoints
- `GET /api/` — Health check
- `POST /api/analyze-image` — Gemini AI analysis (body: `{image_url: string}`)

## Key Files
- `src/pages/AuthPage.js` — Auth UI
- `src/pages/Dashboard.js` — Main app view
- `src/components/UploadModal.js` — Upload + AI flow
- `src/components/SwipeCard.js` — Masonry card
- `src/components/SwipeDetailModal.js` — Detail view
- `backend/server.py` — FastAPI + Gemini endpoint
