# AdCoda | Decode Winning Ads 🎯

**AdCoda** is an AI-powered swipe file engine that helps marketers decode winning ad campaigns. Upload marketing materials and let Google Gemini AI instantly extract marketing formulas (PAS, AIDA, BAB, etc.), emotional hooks, and industry tags.

![AdCoda Banner](https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80)

## ✨ Features

- **🤖 AI-Powered Analysis** - Google Gemini 2.5 Flash extracts marketing insights from any ad image
- **📊 Smart Tagging** - Automatically identifies marketing formulas, industries, and emotional hooks
- **🎨 Modern Dark UI** - Beautiful, responsive interface built with React and Tailwind CSS
- **🔐 Secure Authentication** - Supabase auth with row-level security
- **☁️ Cloud Storage** - Image uploads managed via Supabase Storage
- **🔍 Advanced Search** - Filter by category, formula, and search terms
- **📱 Fully Responsive** - Works seamlessly on desktop, tablet, and mobile

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern UI library
- **Create React App** - Zero-config build tooling
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - High-quality React components
- **Supabase JS Client** - Database and auth integration

### Backend
- **FastAPI** - High-performance Python web framework
- **Google Gemini 2.5 Flash** - AI-powered image analysis
- **Supabase** - PostgreSQL database, authentication, and storage

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18 or higher)
- **Python** (v3.9 or higher)
- **Yarn** package manager
- **Supabase Account** - [Sign up here](https://supabase.com)
- **Google AI Studio API Key** - [Get your key here](https://aistudio.google.com/app/apikey)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd adcoda
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```bash
# Frontend
REACT_APP_BACKEND_URL=http://localhost:8001
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key

# Backend
GOOGLE_API_KEY=your-google-gemini-api-key
```

### 3. Set Up Supabase

1. **Create a new Supabase project** at [supabase.com](https://supabase.com)
2. **Create the Storage Bucket**:
   - Go to **Storage** → **New Bucket**
   - Name: `swipes`
   - Make it **Public**

3. **Run the SQL Setup**:
   - Go to **SQL Editor** → **New Query**
   - Copy and paste the SQL from `/app/memory/PRD.md` (or the setup script below)
   - Click **Run**

<details>
<summary>📜 Click to see SQL Setup Script</summary>

```sql
-- Create the swipes table
CREATE TABLE IF NOT EXISTS public.swipes (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url         TEXT        NOT NULL,
  file_path         TEXT,
  extracted_text    TEXT,
  marketing_formula TEXT,
  industry          TEXT,
  emotional_hook    TEXT,
  category          TEXT,
  title             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own swipes"
  ON public.swipes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own swipes"
  ON public.swipes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own swipes"
  ON public.swipes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Storage policies for 'swipes' bucket
CREATE POLICY "Authenticated users can upload to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'swipes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own storage files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'swipes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Public read access for swipes bucket"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'swipes');
```

</details>

4. **Disable Email Confirmation** (optional, for easier testing):
   - Go to **Authentication** → **Settings** → **Email Auth**
   - Toggle off **"Confirm email"**

### 4. Install Dependencies

**Frontend:**
```bash
cd frontend
yarn install
```

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

### 5. Run the Application

**Backend (Terminal 1):**
```bash
cd backend
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

**Frontend (Terminal 2):**
```bash
cd frontend
yarn start
```

The app will be available at **http://localhost:3000** 🎉

## 📖 Usage

1. **Sign Up / Sign In** - Create an account or log in
2. **Upload an Ad** - Click the "Upload" button and select a marketing image
3. **AI Analysis** - AdCoda will extract text, identify the marketing formula, and tag the industry
4. **Browse Your Library** - Search, filter, and organize your swipe file
5. **Get Insights** - Click any card to see detailed analysis

## 🎨 Demo Mode

Want to try AdCoda without signing up? Add `?demo=true` to the URL:

```
http://localhost:3000?demo=true
```

This will load the app with sample data for exploration.

## 📁 Project Structure

```
adcoda/
├── frontend/               # React + CRA frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Main pages (Auth, Dashboard)
│   │   ├── lib/           # Supabase client
│   │   └── App.js         # Root component
│   ├── package.json
│   └── public/
│       └── index.html
│
├── backend/               # FastAPI backend
│   ├── server.py          # Main API server
│   ├── requirements.txt   # Python dependencies
│   └── .env               # Backend environment variables
│
├── .env.example           # Example environment config
├── README.md              # You are here
└── DEPLOYMENT.md          # Deployment guide
```

## 🌍 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on deploying to:
- **Vercel** (Frontend)
- **Railway** / **Render** (Backend)
- **Supabase** (Database & Storage)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- Built with [Emergent.sh](https://emergent.sh) - AI-powered fullstack development
- Powered by [Google Gemini 2.5 Flash](https://ai.google.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Database and auth by [Supabase](https://supabase.com)

---

**Made with ❤️ by the AdCoda team**

For questions or support, please open an issue on GitHub.
