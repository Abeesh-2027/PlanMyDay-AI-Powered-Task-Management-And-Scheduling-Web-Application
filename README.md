# PlanMyDay: Plan Smart. Work Better. Achieve More.

An AI-powered productivity app. Add tasks, track progress, and let AI (via OpenRouter) turn your pending
tasks into a realistic, break-aware schedule for the day. If the AI is unavailable the app still works,
using a built-in priority-based planner.

| Layer    | Tech                                                                  |
| -------- | --------------------------------------------------------------------- |
| Frontend | React 18, Vite, Tailwind CSS 3, React Router, Axios, Recharts, Lucide |
| Backend  | FastAPI, Pydantic v2, Motor (async MongoDB)                           |
| Database | MongoDB (`planmyday` database, `tasks` collection)                    |
| AI       | OpenRouter chat completions, called only from the backend             |

## Features

- Demo login (any username and password), welcome message, logout. Tasks are saved per username.
- Dashboard: greeting, today's date, stat cards (total / to do / in progress / completed), completion
  ring, daily and weekly productivity charts, today's tasks, AI schedule generator.
- Tasks: add, edit, delete, change status, filter (status, priority, date, search), sort (deadline, priority).
  Pages for My Tasks, In Progress and Completed.
- AI Planner: choose a day and your available hours, press **Generate My Day**, get a timeline with breaks,
  reasons for each placement and a list of tasks that did not fit. **Regenerate** for another arrangement.
- Calendar month view, Progress page, Settings (theme, working hours, backend connection test).
- Responsive from 320px phones to desktops, with a hamburger drawer on mobile, light and dark themes, and
  solid colors only (no gradients anywhere).

## Project structure

```
PlanMyDay/
├── render.yaml              Render blueprint for the API
├── backend/
│   ├── main.py              app, CORS, health check
│   ├── database.py          Motor client + get_tasks_collection dependency
│   ├── models.py            Pydantic models and validation
│   ├── auth.py              demo auth (X-Username header), single place to swap for real auth
│   ├── routes/              tasks.py, progress.py, ai_planner.py
│   ├── services/            openrouter.py (API client), scheduler.py (fallback + AI validation), stats.py
│   ├── tests/               pytest suite (scheduler, stats, API)
│   ├── requirements.txt / requirements-dev.txt / .env.example
└── frontend/
    ├── vercel.json          SPA rewrites for Vercel
    ├── tailwind.config.js   colors come from CSS variables
    └── src/
        ├── styles/index.css design tokens (light + dark) and shared component classes
        ├── context/         auth, theme, toasts, tasks, schedule
        ├── services/        api.js (Axios), auth.js
        ├── components/  pages/  hooks/  utils/
```

## Run locally

Prerequisites: Python 3.11+, Node 18+, and MongoDB (local, or a free MongoDB Atlas cluster).

**Backend**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                   # then edit .env
uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

**Frontend**

```bash
cd frontend
cp .env.example .env            # VITE_API_URL=http://localhost:8000
npm install
npm run dev                     # http://localhost:5173
```

### Environment variables (backend `.env`)

| Variable             | Purpose                                                                       |
| -------------------- | ----------------------------------------------------------------------------- |
| `MONGODB_URL`        | Mongo connection string (`mongodb://localhost:27017` or an Atlas `mongodb+srv://...`) |
| `DATABASE_NAME`      | Database name, default `planmyday`                                            |
| `OPENROUTER_API_KEY` | Optional. Without it the priority-based planner is used                       |
| `OPENROUTER_MODEL`   | Any OpenRouter model id, default `openai/gpt-4o-mini`                         |
| `CORS_ORIGINS`       | Comma-separated frontend origins allowed to call the API                      |

The OpenRouter key is read only by the backend and is never sent to the browser.

## API

All endpoints except `/health` need the `X-Username` header (the frontend adds it automatically).

| Method | Path                     | Description                                                         |
| ------ | ------------------------ | ------------------------------------------------------------------- |
| POST   | `/tasks`                 | Create a task (201)                                                 |
| GET    | `/tasks`                 | List tasks. Query: `status`, `priority`, `date`, `q`, `sort_by`, `order` |
| GET    | `/tasks/{id}`            | Get one task                                                        |
| PUT    | `/tasks/{id}`            | Update a task                                                       |
| PATCH  | `/tasks/{id}/status`     | Change status (`Todo`, `In Progress`, `Done`)                       |
| DELETE | `/tasks/{id}`            | Delete a task (204)                                                 |
| GET    | `/progress?date=`        | Totals, completion %, today, 7-day series, priority breakdown       |
| POST   | `/ai/generate-schedule`  | `{date, start_time, end_time, notes?, regenerate?}` returns a validated schedule |
| GET    | `/health`                | `{status, database}`                                                |

The AI reply is validated before it reaches the UI: valid times, inside your available hours, no overlaps,
only real tasks, sensible durations. Anything that fails (or any OpenRouter error or missing key) falls back to
the priority-based planner and the response includes a `warning` explaining why.

## Deploy

Order matters: database, then API, then frontend (the frontend needs the API URL, the API needs the frontend URL).

1. **MongoDB Atlas.** Create a free cluster, add a database user, allow network access (`0.0.0.0/0` for
   Render's free tier), and copy the `mongodb+srv://...` connection string.
2. **Render (backend).** New + Blueprint, pick this repo (it reads `render.yaml`). Set `MONGODB_URL`,
   `OPENROUTER_API_KEY` (optional) and, after step 3, `CORS_ORIGINS` to your Vercel URL
   (e.g. `https://planmyday.vercel.app`). Check `https://<your-service>.onrender.com/health` returns
   `"database": "connected"`.
3. **Vercel (frontend).** Import the repo and set **Root Directory** to `frontend`. Add the environment
   variable `VITE_API_URL=https://<your-service>.onrender.com` (no trailing slash). Deploy, then put the
   resulting URL into `CORS_ORIGINS` on Render and redeploy the API.

Notes: Render's free plan sleeps after inactivity, so the first request can take up to a minute (the app
allows for this and shows a hint). Vercel preview URLs differ per deployment; to allow them set
`CORS_ORIGIN_REGEX` on Render, for example `https://planmyday.*\.vercel\.app`.

## Tests

```bash
cd backend
pip install -r requirements-dev.txt
pytest
```

## Demo authentication

Login accepts any username and password and is **not secure**: anyone who types the same username sees the
same tasks. It is isolated in `backend/auth.py` and `frontend/src/services/auth.js`, so real authentication
(for example JWT) can replace it without touching the routes or pages.
