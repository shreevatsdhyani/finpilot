"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, EmptyState, ErrorState, LoadingState } from "@/components/ui/shared";
import { listPolicies } from "@/lib/api";
import type { Policy } from "@/types/api";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listPolicies().then(setPolicies).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Financial Policies</h1>
      {policies.length === 0 ? (
        <EmptyState message="No policies available." />
      ) : (
        <div className="space-y-3">
          {policies.map((p) => (
            <Link key={p.id} href={`/policies/${p.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{p.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{p.body}</p>
                  <Badge className="mt-2">{p.category}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
