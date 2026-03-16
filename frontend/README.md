# FinPilot AI — Frontend

Next.js (App Router) + Tailwind CSS + shadcn/ui frontend for FinPilot AI.

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_MOCK` | `true` | Run in mock mode (no backend needed) |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000` | Backend API URL |
| `NEXT_PUBLIC_APP_NAME` | `FinPilot AI` | Display name |

## Mock Mode

When `NEXT_PUBLIC_MOCK=true`, the app returns fixture data with simulated delays.
No backend or MongoDB is required. Useful for UI development and demos.

## Pages

| Path | Description |
|------|-------------|
| `/` | Landing page |
| `/auth/login` | Login |
| `/auth/register` | Registration |
| `/dashboard` | Overview metrics |
| `/salary` | Salary slip list |
| `/salary/upload` | Upload salary slip |
| `/salary/verify/[doc_id]` | Verify extracted fields |
| `/cashflow` | Forecast / Expenses / Goals tabs |
| `/scenarios` | Create & compare scenarios |
| `/investments` | Investment bucket recommendations |
| `/assistant` | RAG chatbot + voice tab |
| `/policies` | Financial policies list |
| `/policies/[policy_id]` | Policy detail |
| `/news` | Financial news |
| `/audit` | Audit trail |
| `/audit/[audit_id]` | Audit detail |
| `/settings` | User preferences |
