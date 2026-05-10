# Datumart – Google Review Feedback Integration

> MERN + Next.js · Google Places API · NLP Sentiment Engine · Brand Advocacy Dashboard

---

## What This Does

| Feature | Description |
|---|---|
| **Google Review Widget** | Embeddable React component showing latest 10 reviews with star ratings |
| **NLP Analysis** | Sentiment score, theme detection, waiting time signal, price perception |
| **Admin Dashboard** | Trends, sentiment pie, theme breakdown, top keywords |
| **Brand Advocacy Panel** | Highlights positive reviews for use in marketing |
| **Risk Panel** | Flags wait-time issues, negative sentiment trends, price concerns |
| **Mock Fallback** | Works without a Google API key for development |

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd datumart-google-review-assignment

# Install server dependencies
cd server
npm install

# Install frontend dependencies
cd ../apps/web-next
npm install
```

### 2. Configure environment variables

**Server:**
```bash
cd server
cp .env.example .env
# Edit .env — set MONGO_URI and optionally GOOGLE_PLACES_API_KEY
```

**Frontend:**
```bash
cd apps/web-next
cp .env.example .env.local
# Edit .env.local — NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Run

Open two terminals:

**Terminal 1 – Backend:**
```bash
cd server
npm run dev
# Server runs at http://localhost:5000
```

**Terminal 2 – Frontend:**
```bash
cd apps/web-next
npm run dev
# App runs at http://localhost:3000
```

### 4. Use the app

1. Open http://localhost:3000 — restaurant website with embedded review widget
2. Click **"Run NLP Analysis"** to trigger sentiment processing
3. Open http://localhost:3000/admin/reviews — admin dashboard
4. Click **"+ Add Restaurant"**, paste a Google Place ID, and click **"Fetch & Analyse"**

---

## Google API Setup (Optional — mock data works without it)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → Enable **Places API**
3. Create an API Key under Credentials
4. Add to `server/.env`:
   ```
   GOOGLE_PLACES_API_KEY=your_key_here
   USE_MOCK_DATA=false
   ```
5. Find your restaurant's Place ID: https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/reviews/:placeId` | Fetch 10 reviews (live or mock) |
| POST | `/api/reviews/analyse` | Run NLP and persist insights |
| GET | `/api/admin/restaurants` | List all restaurants |
| GET | `/api/admin/restaurants/:id/reviewdashboard` | Full dashboard metrics |
| GET | `/api/health` | Health check |

---

## NLP Outputs

Each review is processed for:
- **Sentiment score** (positive / neutral / negative)
- **8 themes**: food quality, service, ambience, value, staff, delivery, wait time, cleanliness
- **Waiting time signal**: detected phrases + positive/negative classification
- **Price perception**: affordable / expensive / value / overpriced
- **Keywords**: top terms extracted with stop-word removal
- **3–4 owner recommendations** per review

---

## Project Structure

```
datumart-google-review-assignment/
├── apps/
│   └── web-next/               # Next.js 14 frontend
│       └── src/
│           ├── app/
│           │   ├── page.tsx                    # Restaurant website
│           │   └── admin/reviews/page.tsx      # Admin dashboard
│           └── components/
│               └── GoogleReviewWidget.tsx      # Embeddable widget
└── server/                     # Node.js + Express backend
    ├── index.js
    ├── models/
    │   ├── Restaurant.js
    │   └── ReviewInsight.js
    ├── routes/
    │   ├── reviews.routes.js
    │   └── admin.routes.js
    └── services/
        ├── googlePlaces.service.js
        └── nlpInsights.service.js
```

---

## Security

- API keys stored in `.env` / `.env.local` — never committed to Git
- CORS restricted to frontend origin
- Rate limiting via `express-rate-limit`
- HTTP security headers via `helmet`
- `.gitignore` excludes all `.env` files
