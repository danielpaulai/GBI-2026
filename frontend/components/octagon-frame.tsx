/**
 * OctagonFrame — Arwes-style chamfered frame chrome.
 *
 * Pure SVG so we don't need Arwes/@arwes/react in the prototype.
 * The developer should swap this for `<Frame />` from @arwes/react when wiring
 * the real stack — see VISUAL_AUDIT.md "frame chrome" commandment.
 *
 * Props mirror Arwes Frame so the swap is one import + one prop rename.
 */

import type { CSSProperties, ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Chamfer size in px. Default 12. */
  chamfer?: number;
  /** Border color (CSS var or hex). Default --pp-primary at 35% alpha. */
  stroke?: string;
  /** Background color (CSS var or hex). Default --pp-surface. */
  fill?: string;
  /** Glow color for the corner accents. Default --pp-primary. */
  accent?: string;
  className?: string;
  style?: CSSProperties;
  /** If true, draws decorative corner accent strokes (Arwes signature). */
  cornered?: boolean;
};

export function OctagonFrame({
  children,
  chamfer = 12,
  stroke = "rgba(236, 67, 87, 0.35)",
  fill = "rgba(40, 12, 16, 0.55)",
  accent = "#ec4357",
  className = "",
  style,
  cornered = true,
}: Props) {
  // Octagon path is rendered via clip-path so children scale with the frame.
  // SVG overlay draws the stroke and corner accents.
  const clip = `polygon(
    ${chamfer}px 0,
    calc(100% - ${chamfer}px) 0,
    100% ${chamfer}px,
    100% calc(100% - ${chamfer}px),
    calc(100% - ${chamfer}px) 100%,
    ${chamfer}px 100%,
    0 calc(100% - ${chamfer}px),
    0 ${chamfer}px
  )`;

  return (
    <div
      className={`relative ${className}`}
      style={{ ...style, clipPath: clip, background: fill }}
    >
      {children}

      {/* Stroke + corner accents overlay */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        {/* Octagon stroke */}
        <polygon
          points={`
            ${chamfer / 4},0
            ${100 - chamfer / 4},0
            100,${chamfer / 4}
            100,${100 - chamfer / 4}
            ${100 - chamfer / 4},100
            ${chamfer / 4},100
            0,${100 - chamfer / 4}
            0,${chamfer / 4}
          `}
          fill="none"
          stroke={stroke}
          strokeWidth="0.4"
          vectorEffect="non-scaling-stroke"
        />

        {cornered ? (
          <>
            {/* Top-left accent */}
            <path
              d={`M 0 ${chamfer / 2} L 0 0 L ${chamfer / 2} 0`}
              fill="none"
              stroke={accent}
              strokeWidth="0.8"
              vectorEffect="non-scaling-stroke"
            />
            {/* Top-right accent */}
            <path
              d={`M ${100 - chamfer / 2} 0 L 100 0 L 100 ${chamfer / 2}`}
              fill="none"
              stroke={accent}
              strokeWidth="0.8"
              vectorEffect="non-scaling-stroke"
            />
            {/* Bottom-right accent */}
            <path
              d={`M 100 ${100 - chamfer / 2} L 100 100 L ${100 - chamfer / 2} 100`}
              fill="none"
              stroke={accent}
              strokeWidth="0.8"
              vectorEffect="non-scaling-stroke"
            />
            {/* Bottom-left accent */}
            <path
              d={`M ${chamfer / 2} 100 L 0 100 L 0 ${100 - chamfer / 2}`}
              fill="none"
              stroke={accent}
              strokeWidth="0.8"
              vectorEffect="non-scaling-stroke"
            />
          </>
        ) : null}
      </svg>
    </div>
  );
}
