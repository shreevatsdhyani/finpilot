"""End-to-end smoke test for all FinPilot backend APIs.

Run with:  python test_apis.py
Requires: the server running on http://localhost:8000
"""

from __future__ import annotations

import json
import subprocess
import sys
import time
import requests

BASE = "http://localhost:8000"
PASS = "✅"
FAIL = "❌"
results: list[tuple[str, bool, str]] = []


def log(name: str, ok: bool, detail: str = ""):
    results.append((name, ok, detail))
    icon = PASS if ok else FAIL
    print(f"  {icon} {name}" + (f"  →  {detail}" if detail else ""))


def wait_for_server(timeout: int = 15):
    """Block until the server responds or timeout."""
    for _ in range(timeout * 2):
        try:
            r = requests.get(f"{BASE}/health", timeout=1)
            if r.status_code == 200:
                return True
        except Exception:
            pass
        time.sleep(0.5)
    return False


def main():
    email = f"test_{int(time.time())}@finpilot.dev"
    password = "Test1234!"
    token = ""

    # ── 1. Health ──
    print("\n═══ Health ═══")
    r = requests.get(f"{BASE}/health")
    log("GET /health", r.status_code == 200, r.text)

    # ── 2. Auth ──
    print("\n═══ Auth ═══")

    # Register
    r = requests.post(f"{BASE}/v1/auth/register", json={
        "email": email, "password": password, "name": "Test User"
    })
    log("POST /v1/auth/register", r.status_code == 201, r.text[:120])
    if r.status_code == 201:
        token = r.json()["access_token"]

    # Duplicate register
    r = requests.post(f"{BASE}/v1/auth/register", json={
        "email": email, "password": password, "name": "Test User"
    })
    log("POST /v1/auth/register (dup)", r.status_code == 400, r.text[:120])

    # Bad email
    r = requests.post(f"{BASE}/v1/auth/register", json={
        "email": "not-an-email", "password": password, "name": "Test"
    })
    log("POST /v1/auth/register (bad email)", r.status_code == 422, r.text[:120])

    # Login
    r = requests.post(f"{BASE}/v1/auth/login", json={
        "email": email, "password": password
    })
    log("POST /v1/auth/login", r.status_code == 200, r.text[:120])
    if r.status_code == 200:
        token = r.json()["access_token"]

    # Bad credentials
    r = requests.post(f"{BASE}/v1/auth/login", json={
        "email": email, "password": "wrong"
    })
    log("POST /v1/auth/login (bad pass)", r.status_code == 401, r.text[:120])

    headers = {"Authorization": f"Bearer {token}"}

    # Me
    r = requests.get(f"{BASE}/v1/auth/me", headers=headers)
    log("GET /v1/auth/me", r.status_code == 200, r.text[:120])

    # No token
    r = requests.get(f"{BASE}/v1/auth/me")
    log("GET /v1/auth/me (no token)", r.status_code == 403, r.text[:120])

    # ── 3. Settings ──
    print("\n═══ Settings ═══")
    r = requests.get(f"{BASE}/v1/settings", headers=headers)
    log("GET /v1/settings (default)", r.status_code == 200, r.text[:120])

    r = requests.post(f"{BASE}/v1/settings", headers=headers, json={
        "currency": "USD", "locale": "en-US", "theme": "dark", "notifications": False
    })
    log("POST /v1/settings (update)", r.status_code == 200, r.text[:120])

    r = requests.get(f"{BASE}/v1/settings", headers=headers)
    ok = r.status_code == 200 and r.json().get("currency") == "USD"
    log("GET /v1/settings (verify)", ok, r.text[:120])

    # ── 4. Salary ──
    print("\n═══ Salary ═══")
    # Upload a dummy PDF
    r = requests.post(
        f"{BASE}/v1/salary/upload",
        headers=headers,
        files={"file": ("test_slip.pdf", b"%PDF-1.4 fake content", "application/pdf")},
    )
    log("POST /v1/salary/upload", r.status_code == 201, r.text[:120])
    salary_doc_id = r.json().get("id") if r.status_code == 201 else None

    # List
    r = requests.get(f"{BASE}/v1/salary", headers=headers)
    log("GET /v1/salary (list)", r.status_code == 200 and len(r.json()) >= 1, f"count={len(r.json())}")

    # Get single
    if salary_doc_id:
        r = requests.get(f"{BASE}/v1/salary/{salary_doc_id}", headers=headers)
        log("GET /v1/salary/:id", r.status_code == 200, r.text[:120])

        r = requests.get(f"{BASE}/v1/salary/{salary_doc_id}/status", headers=headers)
        log("GET /v1/salary/:id/status", r.status_code == 200, r.text[:120])

    # Verify
    if salary_doc_id:
        r = requests.post(f"{BASE}/v1/salary/verify", headers=headers, json={
            "doc_id": salary_doc_id,
            "verified_fields": {"net_salary": 75000}
        })
        log("POST /v1/salary/verify", r.status_code == 200 and r.json()["status"] == "verified", r.text[:120])

    # Bad file type
    r = requests.post(
        f"{BASE}/v1/salary/upload",
        headers=headers,
        files={"file": ("test.exe", b"MZ binary", "application/x-msdownload")},
    )
    log("POST /v1/salary/upload (bad type)", r.status_code == 400, r.text[:120])

    # Invalid ID
    r = requests.get(f"{BASE}/v1/salary/invalid-id", headers=headers)
    log("GET /v1/salary/invalid-id", r.status_code == 400, r.text[:120])

    # ── 5. Expenses ──
    print("\n═══ Expenses ═══")
    r = requests.post(f"{BASE}/v1/expenses", headers=headers, json={
        "category": "food", "amount": 500, "description": "Lunch"
    })
    log("POST /v1/expenses", r.status_code == 201, r.text[:120])
    expense_id = r.json().get("id") if r.status_code == 201 else None

    r = requests.post(f"{BASE}/v1/expenses", headers=headers, json={
        "category": "transport", "amount": 200, "description": "Cab", "date": "2025-01-15"
    })
    log("POST /v1/expenses (with date)", r.status_code == 201, r.text[:120])

    r = requests.get(f"{BASE}/v1/expenses", headers=headers)
    log("GET /v1/expenses", r.status_code == 200 and len(r.json()) >= 2, f"count={len(r.json())}")

    # Delete
    if expense_id:
        r = requests.delete(f"{BASE}/v1/expenses/{expense_id}", headers=headers)
        log("DELETE /v1/expenses/:id", r.status_code == 204, "")

    # ── 6. Goals ──
    print("\n═══ Goals ═══")
    r = requests.post(f"{BASE}/v1/goals", headers=headers, json={
        "title": "Emergency Fund", "target_amount": 300000, "deadline": "2025-12-31", "priority": "high"
    })
    log("POST /v1/goals", r.status_code == 201, r.text[:120])
    goal_id = r.json().get("id") if r.status_code == 201 else None

    r = requests.get(f"{BASE}/v1/goals", headers=headers)
    log("GET /v1/goals", r.status_code == 200 and len(r.json()) >= 1, f"count={len(r.json())}")

    if goal_id:
        r = requests.delete(f"{BASE}/v1/goals/{goal_id}", headers=headers)
        log("DELETE /v1/goals/:id", r.status_code == 204, "")

    # ── 7. Dashboard ──
    print("\n═══ Dashboard ═══")
    r = requests.get(f"{BASE}/v1/dashboard/summary", headers=headers)
    log("GET /v1/dashboard/summary", r.status_code == 200, r.text[:160])

    # ── 8. Forecast ──
    print("\n═══ Forecast ═══")
    r = requests.post(f"{BASE}/v1/forecast/generate", headers=headers, json={"horizon": 3})
    log("POST /v1/forecast/generate", r.status_code == 201, f"months={len(r.json().get('months', []))}")
    forecast_id = r.json().get("id") if r.status_code == 201 else None

    r = requests.post(f"{BASE}/v1/forecast/generate", headers=headers, json={"horizon": 6})
    log("POST /v1/forecast/generate (6m)", r.status_code == 201, f"months={len(r.json().get('months', []))}")

    # List all
    r = requests.get(f"{BASE}/v1/forecast", headers=headers)
    log("GET /v1/forecast (all)", r.status_code == 200 and len(r.json()) >= 2, f"count={len(r.json())}")

    # List filtered by horizon
    r = requests.get(f"{BASE}/v1/forecast?horizon=3", headers=headers)
    log("GET /v1/forecast?horizon=3", r.status_code == 200, f"count={len(r.json())}")

    # ── 9. Scenarios ──
    print("\n═══ Scenarios ═══")
    r = requests.post(f"{BASE}/v1/scenarios", headers=headers, json={
        "name": "Raise 10%", "description": "What if I get a 10% raise",
        "adjustments": {"income_change_pct": 10, "expense_change_pct": 0}
    })
    log("POST /v1/scenarios (raise)", r.status_code == 201, r.text[:120])
    scenario_id_1 = r.json().get("id") if r.status_code == 201 else None

    r = requests.post(f"{BASE}/v1/scenarios", headers=headers, json={
        "name": "Cut expenses 15%", "description": "Budget cut",
        "adjustments": {"income_change_pct": 0, "expense_change_pct": -15}
    })
    log("POST /v1/scenarios (cut)", r.status_code == 201, r.text[:120])
    scenario_id_2 = r.json().get("id") if r.status_code == 201 else None

    r = requests.get(f"{BASE}/v1/scenarios", headers=headers)
    log("GET /v1/scenarios", r.status_code == 200 and len(r.json()) >= 2, f"count={len(r.json())}")

    # Activate
    if scenario_id_1:
        r = requests.post(f"{BASE}/v1/scenarios/{scenario_id_1}/activate", headers=headers)
        log("POST /v1/scenarios/:id/activate", r.status_code == 200 and r.json()["active"], r.text[:120])

    # Compare
    if scenario_id_1 and scenario_id_2:
        r = requests.get(f"{BASE}/v1/scenarios/compare?ids={scenario_id_1},{scenario_id_2}", headers=headers)
        log("GET /v1/scenarios/compare", r.status_code == 200 and len(r.json()["scenarios"]) == 2, f"count={len(r.json()['scenarios'])}")

    # Compare with <2 IDs
    r = requests.get(f"{BASE}/v1/scenarios/compare?ids=abc", headers=headers)
    log("GET /v1/scenarios/compare (<2)", r.status_code == 400, r.text[:120])

    # ── 10. Recommendations ──
    print("\n═══ Recommendations ═══")
    r = requests.post(f"{BASE}/v1/recommendations/generate", headers=headers)
    log("POST /v1/recommendations/generate", r.status_code == 201, r.text[:160])
    rec_id = r.json().get("id") if r.status_code == 201 else None

    r = requests.get(f"{BASE}/v1/recommendations", headers=headers)
    log("GET /v1/recommendations", r.status_code == 200, f"count={len(r.json())}")

    if rec_id:
        r = requests.get(f"{BASE}/v1/recommendations/{rec_id}", headers=headers)
        log("GET /v1/recommendations/:id", r.status_code == 200, r.text[:120])

    # ── 11. Assistant ──
    print("\n═══ Assistant ═══")
    r = requests.post(f"{BASE}/v1/assistant/query", headers=headers, json={
        "query": "Should I invest in equities?"
    })
    log("POST /v1/assistant/query", r.status_code == 200 and len(r.json()["answer"]) > 0, f"sources={len(r.json().get('sources', []))}")

    # Voice
    r = requests.post(f"{BASE}/v1/voice/query", headers=headers, json={
        "text": "How much emergency fund do I need?"
    })
    log("POST /v1/voice/query", r.status_code == 200 and r.json()["answer_text"] != "", f"sources={len(r.json().get('sources', []))}")

    # ── 12. Policies ──
    print("\n═══ Policies ═══")
    r = requests.get(f"{BASE}/v1/policies", headers=headers)
    log("GET /v1/policies", r.status_code == 200 and len(r.json()) >= 5, f"count={len(r.json())}")
    policy_id = r.json()[0]["id"] if r.status_code == 200 and r.json() else None

    if policy_id:
        r = requests.get(f"{BASE}/v1/policies/{policy_id}", headers=headers)
        log("GET /v1/policies/:id", r.status_code == 200, r.text[:120])

        r = requests.post(f"{BASE}/v1/policies/{policy_id}/subscribe", headers=headers)
        log("POST /v1/policies/:id/subscribe", r.status_code == 200, r.text[:120])

    # ── 13. News ──
    print("\n═══ News ═══")
    r = requests.get(f"{BASE}/v1/news", headers=headers)
    log("GET /v1/news", r.status_code == 200 and len(r.json()) >= 2, f"count={len(r.json())}")
    news_id = r.json()[0]["id"] if r.status_code == 200 and r.json() else None

    if news_id:
        r = requests.get(f"{BASE}/v1/news/{news_id}", headers=headers)
        log("GET /v1/news/:id", r.status_code == 200, r.text[:120])

        r = requests.post(f"{BASE}/v1/news/{news_id}/summarize", headers=headers)
        log("POST /v1/news/:id/summarize", r.status_code == 200, r.text[:120])

    # ── 14. Audit ──
    print("\n═══ Audit ═══")
    r = requests.get(f"{BASE}/v1/audit", headers=headers)
    log("GET /v1/audit", r.status_code == 200 and len(r.json()) >= 1, f"count={len(r.json())}")
    audit_id = r.json()[0]["id"] if r.status_code == 200 and r.json() else None

    if audit_id:
        r = requests.get(f"{BASE}/v1/audit/{audit_id}", headers=headers)
        log("GET /v1/audit/:id", r.status_code == 200, r.text[:120])

    # ── Cleanup: delete salary doc ──
    if salary_doc_id:
        r = requests.delete(f"{BASE}/v1/salary/{salary_doc_id}", headers=headers)
        log("DELETE /v1/salary/:id", r.status_code == 204, "")

    # ── Summary ──
    print("\n" + "═" * 60)
    passed = sum(1 for _, ok, _ in results if ok)
    failed = sum(1 for _, ok, _ in results if not ok)
    total = len(results)
    print(f"\n  TOTAL: {total}  |  {PASS} PASSED: {passed}  |  {FAIL} FAILED: {failed}")
    if failed:
        print("\n  Failed tests:")
        for name, ok, detail in results:
            if not ok:
                print(f"    {FAIL} {name}  →  {detail}")
    print()
    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    import os
    os.chdir(r"m:\finpilot\backend")

    # Always start a fresh server subprocess
    print("Starting server subprocess...")
    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"
    server_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=r"m:\finpilot\backend",
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        env=env,
    )
    if not wait_for_server():
        # Read any output for debugging
        out = server_proc.stdout.read(4096).decode() if server_proc.stdout else ""
        print(f"Server failed to start! Output:\n{out}")
        server_proc.kill()
        sys.exit(1)
    print("Server started.\n")

    try:
        main()
    finally:
        server_proc.terminate()
        try:
            server_proc.wait(timeout=5)
        except Exception:
            server_proc.kill()
