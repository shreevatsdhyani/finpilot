"use client";

import { Button } from "@/components/ui/button";

export default function ProtectedError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-[1.75rem] border border-destructive/25 bg-card p-8 text-center shadow-lg">
      <p className="text-sm uppercase tracking-[0.2em] text-destructive">Protected route error</p>
      <h1 className="mt-3 text-3xl font-semibold">We couldn’t load this finance view</h1>
      <p className="mt-3 text-sm text-muted-foreground">{error.message || "Retry the request or move back to a stable part of the app."}</p>
      <div className="mt-6 flex justify-center gap-3">
        <Button onClick={reset}>Retry</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>Back to dashboard</Button>
      </div>
    </div>
  );
}