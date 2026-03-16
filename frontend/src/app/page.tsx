import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-3">
          <svg className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold">FinPilot AI</h1>
      </div>

      <p className="max-w-lg text-center text-lg text-muted-foreground">
        Your local-first predictive personal finance copilot. Upload salary slips, track expenses,
        forecast cash flow, plan scenarios, and get investment recommendations — all running on your machine.
      </p>

      <div className="inline-flex items-center rounded-full border border-green-300 bg-green-50 px-4 py-1 text-sm font-medium text-green-700">
        🔒 100% Local — No data leaves your machine
      </div>

      <div className="flex gap-4">
        <Link href="/auth/login">
          <Button size="lg">Sign In</Button>
        </Link>
        <Link href="/auth/register">
          <Button size="lg" variant="outline">Create Account</Button>
        </Link>
      </div>

      <div className="mt-8 grid max-w-2xl grid-cols-2 gap-4 text-sm text-muted-foreground sm:grid-cols-3">
        {["Salary OCR", "Expense Tracking", "Cash Flow Forecast", "Scenario Planning", "Investment Buckets", "RAG Chatbot"].map((f) => (
          <div key={f} className="flex items-center gap-2 rounded-md border px-3 py-2">
            <span className="text-primary">✓</span> {f}
          </div>
        ))}
      </div>
    </div>
  );
}
