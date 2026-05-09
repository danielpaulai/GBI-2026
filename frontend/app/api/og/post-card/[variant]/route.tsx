// Satori OG endpoint — brand-locked post cards.
// $0/card. Pixel-perfect. Brand-locked via brand.json.
//
// 4 variants: announcement, quote, stat, framework
//
// Usage:
//   /api/og/post-card/announcement?title=Tuesday+morning&body=Your+AI+team+already+worked+the+weekend
//   /api/og/post-card/quote?title=Don%27t+hire+another+human.&attribution=Daniel+Paul
//   /api/og/post-card/stat?title=11+days&body=ROI+on+your+first+AI+agent
//   /api/og/post-card/framework?title=The+4+AI+Executives&body=Marketing+AI|Sales+AI|Ops+AI|Finance+AI
//
// Aspect ratios: ?aspect=square (default) | landscape | portrait | story

import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const DEFAULT_PALETTE = {
  primary: "#ec4357",
  primary_alt: "#d92e44",
  background: "#0a0204",
  accent_gold: "#fbbf24",
  text_primary: "#ffffff",
  text_muted: "#c8c8c8",
};

const DEFAULT_TYPOGRAPHY = {
  display: "Inter",
  body: "Inter",
};

interface CardProps {
  title: string;
  body: string;
  attribution?: string;
  palette: typeof DEFAULT_PALETTE;
  typography: typeof DEFAULT_TYPOGRAPHY;
  brandName: string;
}

function AnnouncementCard({ title, body, palette, typography, brandName }: CardProps) {
  return (
    <div
      style={{
        background: palette.background,
        backgroundImage: `radial-gradient(ellipse at top right, ${palette.primary_alt}40 0%, ${palette.background} 60%)`,
        color: palette.text_primary,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        fontFamily: typography.display,
      }}
    >
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: "0.2em",
          color: palette.accent_gold,
          textTransform: "uppercase",
        }}
      >
        Announcement
      </div>
      <div
        style={{
          fontSize: 84,
          fontWeight: 900,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          color: palette.text_primary,
          maxWidth: "90%",
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div
          style={{
            fontSize: 32,
            color: palette.text_muted,
            lineHeight: 1.4,
            maxWidth: "75%",
          }}
        >
          {body}
        </div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: palette.primary,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          {brandName}
        </div>
      </div>
    </div>
  );
}

function QuoteCard({ title, body, attribution, palette, typography, brandName }: CardProps) {
  return (
    <div
      style={{
        background: palette.background,
        color: palette.text_primary,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: 100,
        fontFamily: typography.body,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 120,
          color: palette.primary,
          lineHeight: 0.8,
          marginBottom: 30,
          fontWeight: 900,
        }}
      >
        &ldquo;
      </div>
      <div
        style={{
          fontSize: 64,
          fontWeight: 700,
          lineHeight: 1.15,
          letterSpacing: "-0.01em",
          color: palette.text_primary,
          maxWidth: "85%",
          marginBottom: 60,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 24,
          color: palette.text_muted,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        — {attribution || brandName}
      </div>
    </div>
  );
}

function StatCard({ title, body, palette, typography, brandName }: CardProps) {
  return (
    <div
      style={{
        background: palette.background,
        color: palette.text_primary,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 80,
        fontFamily: typography.display,
      }}
    >
      <div
        style={{
          fontSize: 240,
          fontWeight: 900,
          lineHeight: 0.95,
          letterSpacing: "-0.04em",
          color: palette.primary,
          marginBottom: 20,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 36,
          fontWeight: 600,
          color: palette.text_primary,
          maxWidth: "80%",
          lineHeight: 1.3,
        }}
      >
        {body}
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: palette.text_muted,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          marginTop: 60,
        }}
      >
        {brandName}
      </div>
    </div>
  );
}

function FrameworkCard({ title, body, palette, typography, brandName }: CardProps) {
  const items = body.split(/\s*[|\n]\s*/).filter(Boolean);

  return (
    <div
      style={{
        background: palette.background,
        color: palette.text_primary,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: 80,
        fontFamily: typography.display,
      }}
    >
      <div
        style={{
          fontSize: 56,
          fontWeight: 900,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          color: palette.text_primary,
          marginBottom: 60,
          maxWidth: "85%",
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {items.slice(0, 6).map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              fontSize: 32,
              color: palette.text_muted,
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                background: palette.primary,
                color: palette.text_primary,
                fontSize: 32,
                fontWeight: 900,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                flexShrink: 0,
              }}
            >
              {i + 1}
            </div>
            <div style={{ flex: 1 }}>{item}</div>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: "auto",
          fontSize: 18,
          fontWeight: 700,
          color: palette.accent_gold,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}
      >
        {brandName}
      </div>
    </div>
  );
}

const VARIANTS: Record<string, (props: CardProps) => JSX.Element> = {
  announcement: AnnouncementCard,
  quote: QuoteCard,
  stat: StatCard,
  framework: FrameworkCard,
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ variant: string }> }
) {
  const params = await context.params;
  const { searchParams } = new URL(req.url);

  const variant = params.variant;
  const Card = VARIANTS[variant];

  if (!Card) {
    return new Response(
      JSON.stringify({ error: "Unknown variant", valid: Object.keys(VARIANTS) }),
      { status: 400, headers: { "content-type": "application/json" } }
    );
  }

  const title = searchParams.get("title") || "Untitled";
  const body = searchParams.get("body") || "";
  const attribution = searchParams.get("attribution") || undefined;
  const brandName = searchParams.get("brand") || "Purely Personal";

  const paletteOverride = searchParams.get("palette");
  const palette = {
    ...DEFAULT_PALETTE,
    ...(paletteOverride ? JSON.parse(paletteOverride) : {}),
  };

  const typographyOverride = searchParams.get("typography");
  const typography = {
    ...DEFAULT_TYPOGRAPHY,
    ...(typographyOverride ? JSON.parse(typographyOverride) : {}),
  };

  const aspect = searchParams.get("aspect") || "square";
  const dimensions = (
    {
      square: { width: 1200, height: 1200 },
      landscape: { width: 1200, height: 627 },
      portrait: { width: 1080, height: 1350 },
      story: { width: 1080, height: 1920 },
    } as Record<string, { width: number; height: number }>
  )[aspect] ?? { width: 1200, height: 1200 };

  return new ImageResponse(
    (
      <Card
        title={title}
        body={body}
        attribution={attribution}
        palette={palette}
        typography={typography}
        brandName={brandName}
      />
    ),
    dimensions
  );
}
