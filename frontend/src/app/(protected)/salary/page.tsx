"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, EmptyState, ErrorState, LoadingState } from "@/components/ui/shared";
import { listSalary } from "@/lib/api";
import type { SalaryDoc } from "@/types/api";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function SalaryListPage() {
  const [docs, setDocs] = useState<SalaryDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listSalary()
      .then(setDocs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Salary Slips</h1>
        <Link href="/salary/upload">
          <Button>Upload New</Button>
        </Link>
      </div>

      {docs.length === 0 ? (
        <EmptyState message="No salary documents yet. Upload one to get started." />
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => (
            <Card key={doc.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium">{doc.filename}</CardTitle>
                <Badge
                  className={
                    doc.status === "verified"
                      ? "bg-green-100 text-green-700 border-green-300"
                      : doc.status === "extracted"
                      ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                      : "bg-gray-100 text-gray-600 border-gray-300"
                  }
                >
                  {doc.status}
                </Badge>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "—"}
                </span>
                {doc.status === "extracted" && (
                  <Link href={`/salary/verify/${doc.id}`}>
                    <Button size="sm" variant="outline">Verify</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
