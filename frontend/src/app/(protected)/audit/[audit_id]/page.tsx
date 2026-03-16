"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, ErrorState, LoadingState } from "@/components/ui/shared";
import { getAudit } from "@/lib/api";
import type { AuditRecord } from "@/types/api";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuditDetailPage() {
  const params = useParams();
  const id = params.audit_id as string;
  const [audit, setAudit] = useState<AuditRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAudit(id).then(setAudit).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!audit) return null;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Audit Record</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Badge>{audit.action}</Badge>
            <span className="text-xs text-muted-foreground">
              {audit.created_at ? new Date(audit.created_at).toLocaleString() : "—"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Request</p>
            <p className="text-sm">{audit.request_summary || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Response</p>
            <p className="text-sm">{audit.response_summary || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Audit ID</p>
            <p className="font-mono text-xs">{audit.id}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
