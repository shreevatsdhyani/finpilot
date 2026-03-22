"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/ui/shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReadiness } from "@/context/readiness-context";
import {
  listChatSessions, createChatSession, getChatSession, sendChatMessage,
  deleteChatSession, voiceQuery,
} from "@/lib/api";
import type { ChatSession, ChatMessage, Source, VoiceResponse } from "@/types/api";
import { AlertTriangle, MessageSquare, Mic, Plus, Trash2, Send, Bot, User } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export default function AssistantPage() {
  const { flags } = useReadiness();

  return (
    <div className="space-y-4">
      <h1 className="mb-6 text-2xl font-bold">AI Assistant</h1>
      {(!flags.incomeExists || !flags.expensesExists) ? (
        <div className="flex items-center gap-2 rounded-[1.25rem] border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4" />
          Limited until setup. Add income and expenses for answers grounded in your actual plan.
        </div>
      ) : null}
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

/* ---- Chat Tab — Full conversation UI ---- */
function ChatTab() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load sessions on mount
  useEffect(() => {
    listChatSessions()
      .then((s) => {
        setSessions(s);
        if (s.length > 0) {
          setActiveSessionId(s[0].id);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setSessionsLoading(false));
  }, []);

  // Load messages when active session changes
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    getChatSession(activeSessionId)
      .then((detail) => setMessages(detail.messages))
      .catch(() => setMessages([]));
  }, [activeSessionId]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function handleNewSession() {
    try {
      const session = await createChatSession();
      setSessions((p) => [session, ...p]);
      setActiveSessionId(session.id);
      setMessages([]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create session");
    }
  }

  async function handleDeleteSession(id: string) {
    try {
      await deleteChatSession(id);
      setSessions((p) => p.filter((s) => s.id !== id));
      if (activeSessionId === id) {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch {}
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    let sessionId = activeSessionId;

    // Auto-create session if none exists
    if (!sessionId) {
      try {
        const session = await createChatSession();
        setSessions((p) => [session, ...p]);
        sessionId = session.id;
        setActiveSessionId(session.id);
      } catch {
        setError("Failed to create session");
        return;
      }
    }

    const userMsg: ChatMessage = {
      role: "user",
      content: query,
      sources: [],
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setLoading(true);
    setError("");

    try {
      const result = await sendChatMessage(sessionId, query);
      setMessages((prev) => [...prev, result.assistant_message]);
      // Update session title in sidebar
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, title: query.slice(0, 50) + (query.length > 50 ? "..." : ""), message_count: s.message_count + 2 }
            : s
        )
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 flex gap-4 h-[600px]">
      {/* Session sidebar */}
      <div className="w-64 shrink-0 flex flex-col border rounded-xl overflow-hidden">
        <div className="p-3 border-b flex items-center justify-between bg-muted/30">
          <span className="text-sm font-medium">Conversations</span>
          <Button variant="ghost" size="sm" onClick={handleNewSession} className="h-7 w-7 p-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sessionsLoading ? (
            <p className="p-3 text-xs text-muted-foreground">Loading...</p>
          ) : sessions.length === 0 ? (
            <p className="p-3 text-xs text-muted-foreground">No conversations yet. Start one!</p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors ${
                  activeSessionId === s.id ? "bg-primary/5 border-l-2 border-primary" : ""
                }`}
                onClick={() => setActiveSessionId(s.id)}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.message_count} messages</p>
                </div>
                <Button
                  variant="ghost" size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 shrink-0 hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id); }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col border rounded-xl overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Bot className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">Ask me about your finances, policies, or anything FinPilot can help with.</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 space-y-1 border-t border-white/10 pt-2">
                    <p className="text-xs opacity-70 font-medium">Sources:</p>
                    {msg.sources.map((s, j) => (
                      <p key={j} className="text-xs opacity-60">• {s.title}</p>
                    ))}
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error */}
        {error && <div className="px-4"><ErrorState message={error} /></div>}

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 border-t flex gap-2">
          <Input
            placeholder="Ask about your finances…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={loading} size="sm" className="px-3">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

/* ---- Voice Tab ---- */
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
