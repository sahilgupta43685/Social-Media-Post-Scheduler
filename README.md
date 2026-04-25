# Social Media Post Scheduler

A full-stack web app to create, schedule, and auto-publish social posts from one dashboard.

## Tech Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB
- Queue/Scheduler: Redis + BullMQ Worker
- Auth: JWT

## Core Features
- User registration and login
- Create, edit, delete scheduled posts
- Post fields:
  - Content
  - Platform (`LinkedIn`, `X`, `Facebook`, `Instagram`)
  - Scheduled time
- Post status tracking (`pending`, `posted`, `failed`)
- Background publishing with retry support
- Integration connect/disconnect for each platform
- Filter posts by status

## Project Structure
```text
social-post-scheduler/
├─ backend/   # Express API, DB models, OAuth, queue worker
└─ frontend/  # React UI
```

## Quick Start
1. Install dependencies:
```bash
cd backend && npm install
cd ../frontend && npm install
```

2. Configure backend `.env` (MongoDB, Redis, OAuth keys, JWT, encryption key).

3. Run 3 processes:
```bash
# terminal 1
cd backend && npm run dev

# terminal 2
cd backend && npm run dev:worker

# terminal 3
cd frontend && npm run dev
```

4. Open `http://localhost:5173`

## Main API Routes
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/posts`
- `POST /api/posts`
- `PUT /api/posts/:id`
- `DELETE /api/posts/:id`
- `POST /api/posts/:id/retry`
- `GET /api/integrations/*` (connect/status)

## Notes
- Worker must be running for scheduled publishing.
- Instagram publishing requires a default public image URL in env.
- For production, keep secrets secure and rotate credentials regularly.
