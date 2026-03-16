# FinPilot AI — Demo Guide

This guide walks you through a demo of all features using **mock mode** (no backend required).

## Setup

```bash
cd frontend
cp .env.example .env.local   # NEXT_PUBLIC_MOCK=true by default
npm install
npm run dev
```

## Demo Flow

### 1. Landing & Auth
- Visit `http://localhost:3000` — see the landing page with feature highlights
- Click **Sign In** → enter any email/password → you are logged in (mock mode accepts anything)

### 2. Dashboard
- See summary cards: Total Income, Expenses, Net Savings, Active Goals, Risk Months

### 3. Salary Slip OCR
- Navigate to **Salary Slips** → Click **Upload New**
- Select any file → it will be "extracted" (mock OCR returns fixed data)
- Click **Verify** to review and confirm extracted fields

### 4. Cash Flow
- **Forecast tab** → Choose horizon (3/6/12 months) → Click **Generate Forecast**
  - See monthly projections with risk months highlighted in red
- **Expenses tab** → Add new expenses → See the list
- **Goals tab** → Add financial goals → See the list

### 5. Scenario Planning
- Create a scenario: e.g. "Raise +10%" with Income Change = 10%
- Create another: "Expense +20%" with Expense Change = 20%
- Click **Compare All** to see side-by-side comparison table

### 6. Investment Recommendations
- Click **Generate New** → See safe-to-invest amount and bucket allocations
- Buckets: Emergency Fund, Fixed Income, Equities, Gold, Cash/Liquid

### 7. AI Assistant
- **Chat tab** → Type a question like "How should I allocate my savings?"
  - See answer text, Sources Used panel, and "View audit trail" link
- **Voice tab** → Type text (voice is simulated in MVP)
  - See transcript, answer, and sources

### 8. Policies
- Browse financial policies → Click one for details
- Click **Subscribe to Updates** (stub)

### 9. News
- View financial news items → Click **Summarize** for AI summary

### 10. Audit Trail
- See all AI interactions logged with timestamps
- Click any record for details (action, request, response)

### 11. Settings
- Change currency, locale, theme, notification preferences → **Save**

---

All features work in mock mode. Switch to `NEXT_PUBLIC_MOCK=false` and run the backend to use real data.
