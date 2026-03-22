"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <div className="max-w-xl rounded-[1.75rem] border border-destructive/25 bg-card p-8 text-center shadow-xl">
          <p className="text-sm uppercase tracking-[0.2em] text-destructive">Application error</p>
          <h1 className="mt-3 text-3xl font-semibold">FinPilot hit an unexpected state</h1>
          <p className="mt-3 text-sm text-muted-foreground">{error.message || "Try again. If this persists, refresh the session or return to the dashboard."}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={reset}>Retry</Button>
            <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>Go to dashboard</Button>
          </div>
        </div>
      </body>
    </html>
  );
}