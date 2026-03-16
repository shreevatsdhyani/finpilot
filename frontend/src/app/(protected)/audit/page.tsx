"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge, EmptyState, ErrorState, LoadingState } from "@/components/ui/shared";
import { listAudits } from "@/lib/api";
import type { AuditRecord } from "@/types/api";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AuditPage() {
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listAudits().then(setAudits).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Audit Trail</h1>
      {audits.length === 0 ? (
        <EmptyState message="No audit records yet." />
      ) : (
        <div className="space-y-2">
          {audits.map((a) => (
            <Link key={a.id} href={`/audit/${a.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between py-3">
                  <div>
                    <Badge className="mr-2">{a.action}</Badge>
                    <span className="text-sm">{a.request_summary}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {a.created_at ? new Date(a.created_at).toLocaleString() : "—"}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
