"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/ui/shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { assistantQuery, voiceQuery } from "@/lib/api";
import type { AssistantResponse, Source, VoiceResponse } from "@/types/api";
import { MessageSquare, Mic } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function AssistantPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">AI Assistant</h1>
      <Tabs defaultValue="chat">
        <TabsList>
          <TabsTrigger value="chat"><MessageSquare className="mr-1 h-4 w-4" />Chat</TabsTrigger>
          <TabsTrigger value="voice"><Mic className="mr-1 h-4 w-4" />Voice</TabsTrigger>
        </TabsList>
        <TabsContent value="chat"><ChatTab /></TabsContent>
        <TabsContent value="voice"><VoiceTab /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ---- Chat ---- */
function ChatTab() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<AssistantResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      const r = await assistantQuery(query);
      setResponse(r);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <Input
          placeholder="Ask about your finances…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={loading}>{loading ? "Thinking…" : "Ask"}</Button>
      </form>
      {error && <ErrorState message={error} />}
      {response && <ResponseCard answer={response.answer} sources={response.sources} auditId={response.audit_id} />}
    </div>
  );
}

/* ---- Voice ---- */
function VoiceTab() {
  const [text, setText] = useState("");
  const [response, setResponse] = useState<VoiceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    try {
      const r = await voiceQuery(text);
      setResponse(r);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 space-y-4">
      <p className="text-sm text-muted-foreground">
        Voice input is simulated as text for MVP. Type what you would say:
      </p>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <Input
          placeholder="Speak or type your question…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={loading}>
          <Mic className="mr-1 h-4 w-4" />
          {loading ? "Processing…" : "Send"}
        </Button>
      </form>
      {error && <ErrorState message={error} />}
      {response && (
        <>
          <Card>
            <CardContent className="py-3">
              <p className="text-sm text-muted-foreground">Transcript: {response.transcript_text}</p>
            </CardContent>
          </Card>
          <ResponseCard answer={response.answer_text} sources={response.sources} auditId={response.audit_id} />
          {response.tts_url && (
            <Card>
              <CardContent className="py-3">
                <audio controls src={response.tts_url} className="w-full" />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

/* ---- Shared response card ---- */
function ResponseCard({ answer, sources, auditId }: { answer: string; sources: Source[]; auditId: string }) {
  return (
    <div className="space-y-3">
      <Card>
        <CardHeader><CardTitle className="text-base">Answer</CardTitle></CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm">{answer}</p>
        </CardContent>
      </Card>

      {sources.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Sources Used</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {sources.map((s, i) => (
              <div key={i} className="rounded border p-3">
                <p className="font-medium text-sm">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.snippet}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {auditId && (
        <Link href={`/audit/${auditId}`} className="inline-block text-sm text-primary hover:underline">
          View audit trail →
        </Link>
      )}
    </div>
  );
}
