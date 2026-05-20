# SEO Automation System

A complete AI-powered SEO automation platform with a professional Python/FastAPI backend and a modern React/TypeScript frontend.

## Project Structure

```
seo-automation-project/
├── backend/          # Python/FastAPI API
│   ├── app/
│   │   ├── main.py           # FastAPI entry point
│   │   ├── config.py         # Environment settings
│   │   ├── database.py       # SQLAlchemy + SQLite
│   │   ├── models/           # Database models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── routers/          # API endpoints
│   │   ├── services/         # Business logic
│   │   ├── middleware/       # Auth & error handling
│   │   ├── cron/             # Scheduled jobs
│   │   └── utils/            # Utilities
│   ├── requirements.txt
│   ├── run.py
│   └── .env.example
│
└── frontend/         # React/TypeScript SPA
    ├── src/
    │   ├── components/       # UI components
    │   ├── pages/            # Page views
    │   ├── services/         # API client
    │   ├── context/          # Auth context
    │   ├── hooks/            # Custom hooks
    │   └── lib/              # Utilities
    ├── package.json
    ├── vite.config.ts
    └── tailwind.config.js
```

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Setup Backend

```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
playwright install chromium

cp .env.example .env
# Edit .env if needed (default mock mode works without API keys)

python run.py
```

Backend runs at **http://localhost:5000**

### 2. Setup Frontend (in a new terminal)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:3000**

### 3. Access the Application

Open http://localhost:3000 in your browser.

- Sign up for a new account
- Add your first website
- Run an SEO audit
- Explore all features!

## Features

### Backend
- JWT Authentication
- Website crawling with Playwright
- AI content optimization (Claude API)
- Keyword research & ranking tracking
- Backlink monitoring
- PDF report generation
- Scheduled cron jobs
- SQLite database (zero setup)
- Mock data fallbacks for all APIs

### Frontend
- Modern dark sidebar design
- Animated dashboard with charts
- SEO score rings
- Interactive data tables
- AI content studio
- Report generation & download
- Responsive design
- Toast notifications

## Environment Variables

### Backend (.env)
```
PORT=5000
JWT_SECRET=your-secret-key
USE_MOCK_DATA=true
ENABLE_CRON_JOBS=false
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
```

## API Documentation

When backend is running, visit:
- Swagger UI: http://localhost:5000/docs
- ReDoc: http://localhost:5000/redoc

## Production Deployment

### Backend
```bash
cd backend
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:5000
```

### Frontend
```bash
cd frontend
npm run build
# Serve dist/ folder with nginx or any static host
```

## License

MIT
