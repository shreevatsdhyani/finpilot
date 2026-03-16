"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge, ErrorState, LoadingState } from "@/components/ui/shared";
import { getPolicy, subscribePolicy } from "@/lib/api";
import type { Policy } from "@/types/api";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PolicyDetailPage() {
  const params = useParams();
  const id = params.policy_id as string;
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    getPolicy(id).then(setPolicy).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [id]);

  async function handleSubscribe() {
    try {
      await subscribePolicy(id);
      setSubscribed(true);
    } catch {}
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!policy) return null;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">{policy.title}</h1>
      <Card>
        <CardHeader>
          <Badge>{policy.category}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">{policy.body}</p>
          <Button onClick={handleSubscribe} disabled={subscribed} variant={subscribed ? "secondary" : "default"}>
            {subscribed ? "Subscribed ✓" : "Subscribe to Updates"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
