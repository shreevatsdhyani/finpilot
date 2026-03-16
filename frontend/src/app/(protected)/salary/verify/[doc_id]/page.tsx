"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState, LoadingState } from "@/components/ui/shared";
import { getSalary, verifySalary } from "@/lib/api";
import type { SalaryDoc } from "@/types/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SalaryVerifyPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.doc_id as string;

  const [doc, setDoc] = useState<SalaryDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});

  useEffect(() => {
    getSalary(docId)
      .then((d) => {
        setDoc(d);
        if (d.extracted) {
          const init: Record<string, string> = {};
          for (const [k, v] of Object.entries(d.extracted)) {
            init[k] = typeof v === "object" ? JSON.stringify(v) : String(v);
          }
          setFields(init);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [docId]);

  async function handleVerify() {
    setSaving(true);
    try {
      await verifySalary(docId, fields);
      router.push("/salary");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!doc) return null;

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Verify: {doc.filename}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Extracted Fields</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(fields).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <Label className="capitalize">{key.replace(/_/g, " ")}</Label>
              <Input
                value={value}
                onChange={(e) => setFields((p) => ({ ...p, [key]: e.target.value }))}
              />
            </div>
          ))}
          <Button onClick={handleVerify} disabled={saving} className="w-full mt-4">
            {saving ? "Verifying…" : "Confirm & Verify"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
