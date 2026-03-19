# YouCube

Transform YouTube videos into AI-powered transcriptions and summaries. YouCube is a full-stack application that processes YouTube videos, extracts transcripts, and generates intelligent summaries using LLM APIs.

## Features

- **YouTube Video Processing**: Submit any YouTube URL for transcription
- **AI-Powered Summaries**: Generate concise summaries with custom prompts
- **Category Management**: Organize videos into categories with custom prompts
- **Real-time Status Tracking**: Monitor job progress with live status updates
- **Responsive Design**: Clean, modern UI with dark mode support

## Tech Stack

### Frontend
- **Next.js 16** (App Router) with React 19
- **TypeScript** for type safety
- **Tailwind CSS 4** for styling
- **TanStack Query** for data fetching and caching
- **Lucide Icons** for iconography

### Backend
- **FastAPI** (Python)
- **SQLAlchemy** for database ORM
- **Celery** for async task processing
- **Redis** for task queue and caching
- **PostgreSQL** for data persistence

### External APIs
- **YouTube Transcript API**: Video transcript extraction
- **SerpAPI**: YouTube search and metadata
- **OpenRouter API**: LLM access for summarization (supports multiple models)

## Project Structure

```
YouCube/
├── frontend/          # Next.js application
│   ├── src/
│   │   ├── app/      # Next.js app router pages
│   │   ├── components/  # Reusable UI components
│   │   ├── hooks/    # React Query hooks
│   │   └── lib/      # API client and types
│   └── package.json
├── backend/           # FastAPI application
│   ├── main.py       # Application entry point
│   ├── models.py     # Database models
│   ├── clients.py    # External API clients
│   └── config.py     # Configuration
└── README.md
```

## Prerequisites

- **Node.js** 20+ and pnpm
- **Python** 3.11+
- **PostgreSQL** database
- **Redis** server
- API keys for:
  - SerpAPI
  - OpenRouter API

## Installation

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create `.env.local` in the backend directory:
   ```env
   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379
   CELERY_BROKER_URL=redis://localhost:6379/0
   CELERY_RESULT_BACKEND=redis://localhost:6379/0

   # PostgreSQL
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_USER=youcube
   POSTGRES_PASSWORD=your_password
   POSTGRES_DB=youcube
   DATABASE_URL=postgresql://youcube:your_password@localhost:5432/youcube

   # API
   API_HOST=0.0.0.0
   API_PORT=8000
   FLOWER_PORT=5555

   # Celery
   CELERY_WORKER_CONCURRENCY=4

   # SerpAPI
   SERPAPI_URL=https://serpapi.com
   SERPAPI_KEY=your_serpapi_key

   # OpenRouter
   OPENROUTER_URL=https://openrouter.ai/api
   OPENROUTER_KEY=your_openrouter_key
   OPENROUTER_FREE_MODEL1=google/gemma-2-9b-it:free
   OPENROUTER_FREE_MODEL2=meta-llama/llama-3-8b-instruct:free
   OPENROUTER_FREE_MODEL3=microsoft/phi-3-mini-128k-instruct:free

   # CORS
   CORS_ORIGIN_1=http://localhost:3000
   CORS_ORIGIN_2=http://127.0.0.1:3000
   CORS_ORIGIN_3=http://localhost:3001
   CORS_ORIGIN_4=http://127.0.0.1:3001
   ```

5. Run database migrations:
   ```bash
   alembic upgrade head
   ```

6. Start the backend server:
   ```bash
   uvicorn app:app --host 0.0.0.0 --port 8000
   ```

7. Start Celery worker (in a separate terminal):
   ```bash
   celery -A tasks.celery worker --loglevel=info
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create `.env.local` in the frontend directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. Start the development server:
   ```bash
   pnpm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Submit a Video**: Paste a YouTube URL, select a category, and choose processing type (transcript only or transcribe & summarize)
2. **View Status**: Track job progress in the Recent Jobs carousel or History page
3. **Manage Categories**: Create categories and custom prompts in the Categories tab
4. **Access Results**: Click any job to view transcript and summary

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/jobs` | List all jobs |
| GET | `/api/v1/jobs/{id}` | Get job status |
| POST | `/api/v1/jobs/transcribe-summarize` | Submit new job |
| POST | `/api/v1/jobs/{id}/cancel` | Cancel a job |
| POST | `/api/v1/jobs/{id}/retry` | Retry failed job |
| DELETE | `/api/v1/jobs/{id}` | Delete a job |
| GET | `/api/v1/categories` | List categories |
| POST | `/api/v1/categories` | Create category |
| GET | `/api/v1/categories/{id}/prompts` | List prompts |
| POST | `/api/v1/categories/{id}/prompts` | Create prompt |


### Building for Production

```bash
# Backend
# Use the command from your k8s configuration

# Frontend
pnpm run build
pnpm run start
```

## License

MIT
