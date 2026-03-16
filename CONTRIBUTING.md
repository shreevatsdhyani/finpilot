# Contributing to FinPilot

Thanks for your interest in improving FinPilot.

## Development setup

1. Clone the repository.
2. Start MongoDB with Docker:
   - `docker compose up -d`
3. Start backend from `backend/`:
   - `python -m venv .venv`
   - `.venv\\Scripts\\activate` (Windows)
   - `pip install -r requirements.txt`
   - `copy .env.example .env`
   - `uvicorn app.main:app --reload --port 8000`
4. Start frontend from `frontend/`:
   - `npm install`
   - `copy .env.example .env.local`
   - `npm run dev`

## Branching and commits

1. Create a feature branch from `main`.
2. Keep commits focused and descriptive.
3. Use clear messages, for example:
   - `feat(api): add scenario compare validation`
   - `fix(auth): prevent duplicate email registration`

## Pull requests

1. Explain the user impact and technical change.
2. Include test evidence (command + result).
3. Keep PR scope small when possible.

## Code style

1. Python: follow PEP 8, prefer explicit typing.
2. TypeScript/React: keep components small and typed.
3. Do not commit secrets, credentials, or local env files.
