# SEO Automation Backend (Python/FastAPI)

This is the Python conversion of the original Node.js/Express backend for the SEO Automation System.

## Tech Stack

- **FastAPI** - Modern, fast web framework
- **SQLAlchemy** - ORM for database operations
- **SQLite** - File-based database (zero setup)
- **Pydantic** - Data validation and settings management
- **Passlib + python-jose** - Password hashing and JWT authentication
- **Playwright** - Website crawling engine (replaces Puppeteer)
- **APScheduler** - Scheduled cron jobs (replaces node-cron)
- **aiosmtplib** - Async SMTP email delivery (replaces Nodemailer)
- **ReportLab** - PDF report generation (replaces Puppeteer PDF)
- **httpx** - Async HTTP client for API calls (replaces axios)

## Quick Start

### 1. Install Dependencies

```bash
cd python_backend
pip install -r requirements.txt
playwright install chromium
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your credentials (or leave USE_MOCK_DATA=true for demo)
```

### 3. Run the Server

```bash
python run.py
```

The API will be available at `http://localhost:5000`.

### 4. Database

SQLite database is auto-created at `./data/seo.db` on first run. No manual setup needed.

## API Endpoints

All endpoints match the original Node.js backend for seamless frontend compatibility:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/auth/signup` | POST | Register new user |
| `/api/auth/login` | POST | Login |
| `/api/auth/profile` | GET | Get user profile |
| `/api/auth/profile` | PUT | Update profile |
| `/api/websites` | GET/POST | List/Create websites |
| `/api/websites/{id}` | GET/PUT/DELETE | Website CRUD |
| `/api/audits` | GET/POST | List/Start audits |
| `/api/audits/{id}` | GET | Audit details |
| `/api/audits/{id}/rerun` | POST | Re-run audit |
| `/api/keywords` | GET/POST | List/Add keywords |
| `/api/keywords/research` | POST | Keyword research |
| `/api/content/optimize` | POST | AI page optimization |
| `/api/content/generate` | POST | AI article generation |
| `/api/content/suggestions/{audit_id}` | GET | Get audit suggestions |
| `/api/rankings` | GET | Get rankings |
| `/api/rankings/update` | POST | Update rankings |
| `/api/backlinks` | GET | Get backlinks |
| `/api/backlinks/update` | POST | Update backlinks |
| `/api/reports` | GET/POST | List/Generate reports |
| `/api/reports/{id}` | GET | Report details |
| `/api/reports/{id}/download` | GET | Download PDF |
| `/api/reports/{id}` | DELETE | Delete report |
| `/api/dashboard/overview` | GET | Dashboard data |
| `/api/dashboard/score-trend` | GET | SEO score trend |

## Project Structure

```
python_backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Environment settings
│   ├── database.py          # SQLAlchemy setup
│   ├── models/              # Database models
│   │   ├── user.py
│   │   ├── website.py
│   │   ├── audit.py
│   │   ├── keyword.py
│   │   ├── backlink.py
│   │   └── report.py
│   ├── schemas/             # Pydantic schemas
│   ├── routers/             # API route handlers
│   ├── services/            # Business logic
│   │   ├── crawler_service.py
│   │   ├── claude_service.py
│   │   ├── seo_api_service.py
│   │   ├── email_service.py
│   │   └── pdf_service.py
│   ├── middleware/          # Auth & error handling
│   ├── cron/                # Scheduled jobs
│   └── utils/               # Logger & helpers
├── data/                    # SQLite database
├── reports/                 # Generated PDFs
├── requirements.txt
├── .env.example
├── run.py
└── README.md
```

## Mock Data

Set `USE_MOCK_DATA=true` in `.env` to use comprehensive mock fallbacks for all external APIs without real API keys.

## Scheduled Jobs

Set `ENABLE_CRON_JOBS=true` to enable:
- **Daily 2:00 AM** - Website crawling for active projects
- **Daily 3:00 AM** - Keyword ranking updates
- **Weekly Monday 8:00 AM** - Automated report generation and email delivery

## Production Deployment

1. Set `NODE_ENV=production`
2. Set `USE_MOCK_DATA=false` and add real API keys
3. Use a strong `JWT_SECRET`
4. Configure production SMTP
5. Use Gunicorn with Uvicorn workers:
   ```bash
   gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:5000
   ```
