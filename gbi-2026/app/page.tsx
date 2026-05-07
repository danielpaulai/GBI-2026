const highlights = [
  {
    title: "Dense, curated curriculum",
    body: "Frameworks you can deploy the week you return — not theory for the shelf.",
  },
  {
    title: "Operator-led sessions",
    body: "Faculty and guests who have scaled, exited, and hired across APAC.",
  },
  {
    title: "Singapore as the lab",
    body: "Walk the regulatory, talent, and go-to-market realities of the region from the inside.",
  },
];

const contactEmail =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@example.com";

const audience = [
  "Founders preparing a Singapore or regional HQ move",
  "C-suite sponsors aligning board-level expansion bets",
  "Investors and advisors who need a shared language with portfolio teams",
];

export default function Home() {
  return (
    <div className="mesh-bg grain relative z-0 flex min-h-full flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[var(--gold)] focus:px-3 focus:py-2 focus:text-[var(--bg-deep)]"
      >
        Skip to content
      </a>

      <header className="relative z-10 border-b border-[var(--border)] bg-[var(--bg-elevated)]/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <span
              className="font-display text-lg font-semibold tracking-tight text-[var(--text)]"
              aria-hidden
            >
              <span className="text-[var(--gold)]">GBI</span>
              <span className="text-[var(--text-muted)]"> · </span>
              Singapore
            </span>
          </div>
          <nav
            className="hidden items-center gap-8 text-sm font-medium text-[var(--text-muted)] sm:flex"
            aria-label="Primary"
          >
            <a href="#experience" className="transition hover:text-[var(--text)]">
              Experience
            </a>
            <a href="#audience" className="transition hover:text-[var(--text)]">
              Who it&apos;s for
            </a>
            <a
              href="#register"
              className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[var(--text)] transition hover:border-[var(--gold)]/50"
            >
              Request access
            </a>
          </nav>
          <a
            href="#register"
            className="rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-4 py-2 text-sm font-semibold text-[var(--gold)] transition hover:bg-[var(--gold)]/20 sm:hidden"
          >
            Register
          </a>
        </div>
      </header>

      <main id="main" className="relative z-10 flex-1">
        <section
          className="mx-auto max-w-6xl px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24"
          aria-labelledby="hero-heading"
        >
          <p className="reveal font-display text-xs font-semibold uppercase tracking-[0.35em] text-[var(--mint)]">
            Immersive · 2026 · Invitation-only
          </p>
          <div className="mt-6 max-w-3xl">
            <h1
              id="hero-heading"
              className="reveal reveal-delay-1 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-[var(--text)] sm:text-5xl md:text-6xl"
            >
              Build the conviction and network to win in Asia — from Singapore.
            </h1>
            <p className="reveal reveal-delay-2 mt-6 max-w-2xl text-lg leading-relaxed text-[var(--text-muted)] sm:text-xl">
              GBI Singapore 2026 is a compact, high-trust immersion for leaders who
              need clarity, pace, and relationships — not another generic conference
              pass.
            </p>
          </div>
          <div className="reveal reveal-delay-3 mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <a
              href="#register"
              className="inline-flex items-center justify-center rounded-full bg-[var(--gold)] px-8 py-3.5 text-center text-sm font-semibold text-[var(--bg-deep)] shadow-[0_0_40px_-12px_rgba(212,175,55,0.65)] transition hover:brightness-110"
            >
              Join the interest list
            </a>
            <a
              href="#experience"
              className="inline-flex items-center justify-center rounded-full border border-[var(--border)] px-8 py-3.5 text-center text-sm font-semibold text-[var(--text)] transition hover:border-[var(--mint)]/50 hover:text-[var(--mint)]"
            >
              See the experience
            </a>
          </div>
          <dl className="reveal reveal-delay-3 mt-16 grid gap-6 border-t border-[var(--border)] pt-10 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Location
              </dt>
              <dd className="mt-1 font-display text-lg text-[var(--text)]">Singapore</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Format
              </dt>
              <dd className="mt-1 font-display text-lg text-[var(--text)]">
                Multi-day immersion + private dinners
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Cohort size
              </dt>
              <dd className="mt-1 font-display text-lg text-[var(--text)]">Intentionally small</dd>
            </div>
          </dl>
        </section>

        <section
          id="experience"
          className="border-y border-[var(--border)] bg-[var(--bg-elevated)]/35 py-20 sm:py-24"
          aria-labelledby="experience-heading"
        >
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <div className="accent-line" />
              <h2
                id="experience-heading"
                className="mt-6 font-display text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl"
              >
                What makes this different
              </h2>
              <p className="mt-4 text-lg text-[var(--text-muted)]">
                Three commitments we optimise for — so your time in-market compounds.
              </p>
            </div>
            <ul className="mt-14 grid gap-6 md:grid-cols-3">
              {highlights.map((item) => (
                <li
                  key={item.title}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-[var(--gold)]/35"
                >
                  <h3 className="font-display text-xl font-semibold text-[var(--text)]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="audience"
          className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24"
          aria-labelledby="audience-heading"
        >
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <div>
              <h2
                id="audience-heading"
                className="font-display text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl"
              >
                Built for decision-makers under real constraints
              </h2>
              <p className="mt-4 text-lg text-[var(--text-muted)]">
                If your calendar is already full, this is designed to earn its place:
                tight agendas, pre-reads that respect your time, and follow-through
                after you fly home.
              </p>
            </div>
            <ul className="space-y-4" role="list">
              {audience.map((line) => (
                <li
                  key={line}
                  className="flex gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 text-[var(--text)]"
                >
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--gold)]"
                    aria-hidden
                  />
                  <span className="text-sm leading-relaxed sm:text-base">{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="register"
          className="border-t border-[var(--border)] bg-gradient-to-b from-[var(--bg-elevated)]/60 to-[var(--bg-deep)] py-20 sm:py-28"
          aria-labelledby="register-heading"
        >
          <div className="mx-auto max-w-2xl px-5 text-center sm:px-8">
            <h2
              id="register-heading"
              className="font-display text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl"
            >
              Request a private brief
            </h2>
            <p className="mt-4 text-[var(--text-muted)]">
              Share your role and expansion timeline. We&apos;ll follow up with dates,
              investment structure, and fit — no mass brochure.
            </p>
            <div className="mt-10 flex justify-center">
              <a
                href={`mailto:${encodeURIComponent(contactEmail)}?subject=${encodeURIComponent("GBI Singapore 2026 — interest")}`}
                className="inline-flex w-full items-center justify-center rounded-full bg-[var(--gold)] px-8 py-3.5 text-sm font-semibold text-[var(--bg-deep)] transition hover:brightness-110 sm:w-auto"
              >
                Email the team
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[var(--border)] py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 text-sm text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="font-display text-[var(--text)]">
            GBI Singapore <span className="text-[var(--gold)]">2026</span>
          </p>
          <p>Curated programme. Final dates and venue announced to accepted participants.</p>
        </div>
      </footer>
    </div>
  );
}
