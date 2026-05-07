"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type StreamPayload = {
  token?: string;
  error?: string;
  update?: Record<string, unknown>;
  done?: boolean;
};

function contentToString(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((block) => {
      if (typeof block === "object" && block !== null && "text" in block) {
        const t = (block as { text?: unknown }).text;
        return typeof t === "string" ? t : "";
      }
      return "";
    })
    .join("");
}

/** Pull assistant-visible text from one LangGraph `updates` chunk (serialized messages). */
function assistantTextFromUpdate(update: Record<string, unknown>): string {
  const parts: string[] = [];

  function walk(node: unknown): void {
    if (node === null || node === undefined) return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (typeof node !== "object") return;
    const o = node as Record<string, unknown>;
    const typ = o.type;
    if (typ === "AIMessage" || typ === "AIMessageChunk") {
      const text = contentToString(o.content);
      if (text.trim()) parts.push(text);
      return;
    }
    for (const v of Object.values(o)) walk(v);
  }

  walk(update);
  return parts.join("\n\n");
}

function parseCompleteSseBlocks(buffer: string): {
  events: StreamPayload[];
  rest: string;
} {
  const events: StreamPayload[] = [];
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";
  for (const part of parts) {
    for (const line of part.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      try {
        events.push(JSON.parse(line.slice(6)) as StreamPayload);
      } catch {
        /* ignore malformed SSE line */
      }
    }
  }
  return { events, rest };
}

function parseTrailingBuffer(buffer: string): StreamPayload[] {
  const events: StreamPayload[] = [];
  if (!buffer.trim()) return events;
  for (const line of buffer.split("\n")) {
    if (!line.startsWith("data: ")) continue;
    try {
      events.push(JSON.parse(line.slice(6)) as StreamPayload);
    } catch {
      /* ignore */
    }
  }
  return events;
}

export function DayOneChat() {
  const [intent, setIntent] = useState("");
  const [streamText, setStreamText] = useState("");
  const [phase, setPhase] = useState<"idle" | "busy" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const send = useCallback(async () => {
    const trimmed = intent.trim();
    if (!trimmed) return;

    setErrorMessage(null);
    setStreamText("");
    setPhase("busy");

    try {
      const res = await fetch(`${API_BASE}/api/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: trimmed }),
      });

      if (!res.ok) {
        let detail = await res.text();
        try {
          const parsed = JSON.parse(detail) as { detail?: unknown };
          if (typeof parsed.detail === "string") detail = parsed.detail;
        } catch {
          /* use raw text */
        }
        throw new Error(detail || `Request failed (${res.status})`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body to read.");

      const decoder = new TextDecoder();
      let buffer = "";
      let assembled = "";

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const { events, rest } = parseCompleteSseBlocks(buffer);
        buffer = rest;

        for (const ev of events) {
          if (ev.error) {
            setErrorMessage(ev.error);
            setPhase("error");
            return;
          }
          if (ev.token) assembled += ev.token;
          if (ev.update && typeof ev.update === "object") {
            const delta = assistantTextFromUpdate(ev.update as Record<string, unknown>);
            if (delta) assembled += (assembled ? "\n\n" : "") + delta;
          }
          if (ev.done) {
            /* stream complete */
          }
        }
        if (assembled) setStreamText(assembled);
        if (done) break;
      }

      for (const ev of parseTrailingBuffer(buffer)) {
        if (ev.error) {
          setErrorMessage(ev.error);
          setPhase("error");
          return;
        }
        if (ev.token) assembled += ev.token;
        if (ev.update && typeof ev.update === "object") {
          const delta = assistantTextFromUpdate(ev.update as Record<string, unknown>);
          if (delta) assembled += (assembled ? "\n\n" : "") + delta;
        }
      }
      if (assembled) setStreamText(assembled);

      setPhase("idle");
    } catch (err) {
      setPhase("error");
      setErrorMessage(err instanceof Error ? err.message : "Request failed");
    }
  }, [intent]);

  const busy = phase === "busy";
  const showSkeleton = busy && streamText.length === 0;

  return (
    <Card className="w-full max-w-2xl border-[#00d4ff]/25 bg-card/90 text-card-foreground shadow-[0_0_32px_-12px_rgba(0,212,255,0.45),0_0_64px_-24px_rgba(0,212,255,0.25),0_0_96px_-40px_rgba(0,212,255,0.12)] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
      <CardHeader className="gap-2">
        <CardTitle className="text-xl text-white">Jarvis run</CardTitle>
        <CardDescription className="text-muted-foreground">
          POST <span className="font-mono text-[#00d4ff]">/api/run</span> with{" "}
          <span className="font-mono">{"{ intent }"}</span> — CEO supervisor + departments
          (SSE <span className="font-mono">updates</span>).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="flex flex-col gap-4 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <div className="flex-1 space-y-2">
            <label htmlFor="intent" className="text-sm text-muted-foreground">
              Intent
            </label>
            <Input
              id="intent"
              name="intent"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder="Plan LinkedIn content for this week"
              autoComplete="off"
              disabled={busy}
              className="border-[#00d4ff]/20 bg-background/60"
            />
          </div>
          <Button
            type="submit"
            disabled={busy || !intent.trim()}
            className="bg-[#00d4ff] text-[#050810] hover:bg-[#33ddff] sm:mb-0"
          >
            {busy ? "Streaming…" : "Send"}
          </Button>
        </form>

        <div
          className="min-h-40 rounded-lg border border-border bg-background/40 p-4"
          aria-live="polite"
        >
          {showSkeleton ? (
            <div className="space-y-3">
              <Skeleton className="h-4 max-w-[75%] bg-muted" />
              <Skeleton className="h-4 w-full bg-muted" />
              <Skeleton className="h-4 max-w-[85%] bg-muted" />
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground/90">
              {streamText || (
                <span className="text-muted-foreground">
                  Response appears here token-by-token.
                </span>
              )}
            </p>
          )}
        </div>

        {errorMessage ? (
          <p className="text-sm text-red-400" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        API base: <span className="ml-1 font-mono text-[#00d4ff]/90">{API_BASE}</span>
      </CardFooter>
    </Card>
  );
}
