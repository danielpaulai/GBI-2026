import { DayOneChat } from "@/components/day-one-chat";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#050810]">
      <div
        className="pointer-events-none absolute inset-0 opacity-20 blur-3xl"
        aria-hidden
      >
        <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#00d4ff]/30" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-8 px-4 py-16">
        <header className="space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#00d4ff]/80">
            Day 1 · 10X Command Center
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Claude streaming check
          </h1>
          <p className="max-w-xl text-muted-foreground">
            Start the Python API on port 8000, then send a prompt. Tokens stream over{" "}
            <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-sm text-[#00d4ff]">
              text/event-stream
            </code>
            .
          </p>
        </header>

        <DayOneChat />
      </div>
    </div>
  );
}
