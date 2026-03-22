# FinPilot AI - Project Plan & Execution Flow 🚀

This document details the current state of the application, next implementation steps (starting with the backend), and the overall user progression flow. It acts as a compass for completing the FinPilot platform.

---

## 🧭 The Core User Journey (Flow)

**1. Onboarding & Auth**
- User arrives at the app and logs in or registers with Email/Name/Password.
- *Status:* **Implemented (Simplified Auth).**

**2. The Locked Dashboard**
- First login shows the `Dashboard` with a "Finish setup to unlock planning" checklist.
- Left sidebar shows navigation links, but advanced links (`Cash Flow`, `Scenarios`, `Investments`) are **locked**.

**3. Data Intake (Establishing Trustworthy Data)**
- **Step 1: Add Income.** User uploads a Salary Slip (OCR parsing) OR enters it manually. 
   - *Triggers:* Forecast engine base values, unlocks `Cash Flow`.
- **Step 2: Add Expenses Baseline.** User adds their regular monthly expenses.
   - *Triggers:* Completes the mandatory data triad. Allows calculating "Net Savings".

**4. 🔮 The Analytics Phase**
- **Step 3: Define Goals.** Optional but recommended. (e.g., "Buy Car in 2 Years for $20k").
- **Step 4: Generate 6-Month Forecast.** With Income + Expenses, the system generates a 6-month financial trajectory.
   - *Triggers:* Calculates "Risk Months" (months net savings < 0). Unlocks `Scenarios`.

**5. 🔀 The Planning Phase**
- **Scenarios (What-if Analysis):** User tests adjustments (e.g., "+$500 income", "-$100 expenses"). System recalculates the forecast baseline dynamically.
- **Generate Investment Plan:** Uses user's financial profile + goal horizons to recommend asset allocation buckets via LLM logic. Unlocks `Investments`.

**6. Daily Usage (Always Active)**
- `AI Assistant`: Ask chat queries based on RAG across finances, or use Voice-to-Voice mode.
- `Policies` / `News`: Updates on personal finance news and general rules.
- `Audit Trail`: Transparent view of everything happening under the hood.

---

## 🗂️ Component Status matrix

| Feature / Module | Status | Backend implementation | Frontend implementation | Notes / Blockers |
| :--- | :---: | :--- | :--- | :--- |
| **Authentication** | 🟢 Done | Fully active (JWT). Removed Access ID complexity. `PATCH /v1/auth/me` added for profile updates. | Login/Register UI complete. `IS_MOCK` toggles mock auth. | Working fully. Display name now editable. |
| **Settings & Preferences** | 🟢 Done | Enhanced models with `risk_profile`, `store_salary_files`, `store_voice_transcripts`. | Full settings page with Account, Appearance, Planning Defaults, Data & Privacy sections. | Theme switching works. Risk profile drives forecasts. |
| **UI Layout & Sidebar** | 🟢 Done | N/A | Sidebar fixed, popovers using Portals complete. Responsive fixes complete. | Looks premium. |
| **Salary / Income** | 🟡 Partial | DB Models enhanced: comprehensive payroll structure + `additional_incomes` support. Routes ready. | Rich intake dialog with collapsible sections (earnings/deductions), dynamic additional income sources, Indian payroll context. | **OCR extraction pending.** Manual entry fully functional. |
| **Expenses (Cashflow)** | 🟡 Partial | `expenses.py` enhanced with category support, frequency normalization. CRUD routes ready. | Comprehensive dialog with 14 Indian expense categories, frequency options, is_essential/is_fixed flags. Add-on-demand workflow. | Ready for backend integration. Frontend fully built. |
| **Goals** | 🟡 Partial | `goals.py` CRUD endpoints ready. | Rich dialog with deadline calculation, priority levels, risk tolerance per-goal, flexibility options. Computed preview shows required monthly savings. | Multi-horizon goal support integrated. |
| **Forecast Engine** | 🟡 Partial | `forecast.py` acts as core endpoint. Now accepts `risk_profile` parameter. | Dashboard handlers fetch user's risk_profile before generating forecast. UI shows "generated based on your risk profile". | Needs real math engine. Backend calculation pending. |
| **Scenarios Analysis** | 🟡 Partial | `scenarios.py` CRUD endpoints done. Now receives `risk_profile` context. | UI is locked until forecast done. | Scenarios recalculation engine needs robust mathematical precision. |
| **Investment Plan** | 🟡 Partial | `recommendations.py` RAG prompt endpoint. Now accepts `risk_profile` parameter. | UI mocked. | Needs integration with OpenAI / Gemini API in backend. Risk signal properly threaded. |
| **AI Assistant (Chat)** | 🟡 Partial | Text API `chat.py` built. Audit logs attached. | Assistant page exists, needs real hookup. | **RAG logic needs embedding DB hookup.** |
| **AI Assistant (Voice)**| 🔴 Pending | Route stub exists (`voice/query`). | Needs UI mic integration. | **User will handle STT/TTS service module.** |
| **News / Policies** | 🟡 Partial | `news.py` uses NewsData API. | Sidebar options & news page complete with country filter, load-more pagination. | Fetching and caching logic needed to prevent rate limits. |
| **Audit Trail** | 🟢 Done | `write_audit` logs interactions to DB. | Mocking in UI right now via mock-data.ts. | Integrated into Chat flow. Need to integrate into Login/Forecast. |
| **Alerts / Settings** | 🟡 Partial | `alerts.py` / `settings.py` CRUD endpoints enhanced. | Dropdown & alerts box complete. Settings page fully functional. | System needs to intelligently CREATE alerts (e.g. Risk Month detected). |

---

## ✅ Completed in Latest Sprint (March 22, 2026)

### Infrastructure & User Management
- ✅ `PATCH /v1/auth/me` endpoint for display name updates
- ✅ Enhanced `UserSettings` model with planning defaults
- ✅ Full Settings page overhaul (Account/Appearance/Planning/Data&Privacy)
- ✅ Theme system integration (System/Light/Dark)

### Data Intake & Forms
- ✅ Comprehensive multi-step intake dialogs on Dashboard
- ✅ **Income Form**: Collapsible earnings/deductions sections, Indian payroll structure (CTC, HRA, DA, PF, PT, TDS, ESI), dynamic additional income sources
- ✅ **Expense Form**: 14 Indian categories, frequency normalization, is_essential/is_fixed flags
- ✅ **Goal Form**: Deadline calculation, priority/risk-tolerance/flexibility options, required monthly savings preview

### Planning Defaults Integration
- ✅ Risk profile (Conservative/Balanced/Aggressive) stored in Settings
- ✅ Risk profile now passed to `generateForecast()` and `generateRecommendations()`
- ✅ Backend models (`settings.py`) enhanced to support risk_profile, store_salary_files, store_voice_transcripts

### Frontend Polish
- ✅ News page with country filter and load-more pagination
- ✅ All UI components wired to real API handlers
- ✅ Dirty state tracking on Settings page
- ✅ Toast notifications for user feedback
- ✅ Timestamp displays for "Saved at" status

---

## 🏗️ Priority Action Plan (Next Phases)

Here is exactly what needs to be tackled next, ordered by priority of the core flow:

### Phase 1: Core Data Integrity & Real Backend Hookup
1. **Un-mock the Frontend:** Change `NEXT_PUBLIC_MOCK=false` in `.env.local` and test real backend calls.
2. **Income Intake Real Flow:**
   - Verify `POST /v1/salary` (manual entry) saves to MongoDB with enriched fields
   - Test fetch via `GET /v1/salary/{docId}` returns all payroll components
   - Verify `GET /v1/auth/me` returns verified income status
3. **Expenses Intake Real Flow:**
   - Verify `POST /v1/expenses` (bulk or single) saves with frequency normalization
   - Verify `GET /v1/expenses` returns all entries with `monthly_amount` computed
4. **Readiness State Route (`dashboard.py`):**
   - Ensure `GET /v1/dashboard/summary` dynamically checks:
     - Income exists? Income verified?
     - Expenses mapped? (at least 1 entry)
     - Forecast generated?
     - Plan exists?
   - This drives the entire frontend locking mechanism (unlocks Cash Flow → Scenarios → Investments)

### Phase 2: Math & Forecasting (Backend)
1. **Forecast Generator (`services/forecast.py`):**
   - Write the exact projection math:
     - Take baseline net income (from salary) + risk_profile
     - Take baseline expenses (summed, normalized to monthly)
     - Project 6 months: `net_month = income - expenses` for each month
     - Identify "risk_months" where `net_month < 0` (deficit)
     - Return `Forecast` object with monthly breakdown
   - Integrate with risk_profile: Conservative might have buffer assumptions, Aggressive higher utilization.
2. **Scenario Math Pipeline (`services/scenarios.py`):**
   - Build the overlay math:
     - Take active forecast as baseline
     - Apply scenario adjustments (e.g., "+$5k income", "-$2k expenses")
     - Recalculate 6-month trajectory dynamically
     - Return new projected trajectory with updated risk_months

### Phase 3: Alert System (Backend)
1. **Intelligent Alert Generation (`alerts.py`):**
   - After forecast generation, auto-create alerts:
     - "⚠️ Risk Month Detected (June) — Net savings negative" if risk_months > 0
     - "✅ All 6 months surplus" if no risk_months
     - "🎯 On track to hit Goal X" if goal progress good
   - Store these in `alerts` collection
2. **Hook into Chat/Audit:**
   - Every forecast/scenario/plan generation logs to audit trail with risk signals

### Phase 4: AI & LLM Orchestration (Backend)
1. **Investment Prompt Assembly (`services/recommendations.py`):**
   - Connect to OpenAI / Gemini API
   - Build dynamic prompt using:
     - User's net_savings amount
     - Risk profile (drives bucket selection)
     - Goal horizons (short/medium/long)
     - Returns structured JSON with buckets: `[{"name": "Emergency Fund", "pct": 20, "vehicles": [...]}, ...]`
2. **RAG Setup for Chat (`services/rag.py`):**
   - Embed user's financial documents (salary slips, policy docs)
   - Chat queries search embeddings + call LLM to answer questions
   - Built-in context awareness (e.g., "What are my risk months?" → retrieves forecast data)

### Phase 5: Frontend Connection & Visualization
1. **Connect `<SalaryUpload />` → real backend**
   - File upload + OCR trigger (will integrate with user's OCR service later)
2. **Connect `<ExpensesManager />` → real dashboard**
   - Form submission updates backend, refreshes KPI cards
3. **Connect `<Scenarios />` visualization**
   - Real-time chart updates as user adjusts scenario sliders
4. **Test full "Zero to Plan" user flow end-to-end**

---

## 🎯 Recommended Next Step

**START WITH PHASE 1**: Turn off `IS_MOCK` and get the complete data intake → readiness → dashboard flow working with real MongoDB. This is the foundation for everything else.

**Why Phase 1 First?**
- Everything downstream depends on trustworthy income + expenses data
- Unlocks testing in real environment before complex math (forecast/scenarios/LLM)
- Gives visibility into what the backend is actually storing

---

*Updated by FinPilot Agent - Ready to execute Phase 1 whenever you are.*
