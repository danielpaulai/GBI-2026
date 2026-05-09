/**
 * CEOOrb — pulsing red orb with concentric rings.
 *
 * CSS-only stub. The developer must replace this with a react-three-fiber
 * sphere when wiring the real stack — see UX_RESTRUCTURE_GUIDELINES.md and
 * VISUAL_AUDIT.md "CEO orb" spec.
 *
 * The R3F version should:
 *   - Use a MeshStandardMaterial with emissive ec4357
 *   - Add a depth-of-field post-processing pass (postprocessing/n8ao)
 *   - Drive scale via audio analyser when ElevenLabs is speaking
 *   - Drive ring opacity via XState voice machine state
 *
 * For now this is enough to demo the visual bar.
 */

import type { CSSProperties } from "react";

type Props = {
  /** Diameter in px. Default 120. */
  size?: number;
  /** "idle" pulses gently, "speaking" pulses faster + brighter. */
  state?: "idle" | "speaking" | "thinking";
  className?: string;
  style?: CSSProperties;
};

export function CEOOrb({
  size = 120,
  state = "idle",
  className = "",
  style,
}: Props) {
  const speakingMod =
    state === "speaking"
      ? "[animation-duration:1.6s]"
      : state === "thinking"
        ? "[animation-duration:2.4s]"
        : "";

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size, ...style }}
      role="status"
      aria-label={`AI CEO orb — ${state}`}
    >
      {/* Outermost halo ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(236,67,87,0.18) 0%, rgba(236,67,87,0.05) 40%, transparent 70%)",
          transform: "scale(1.6)",
        }}
        aria-hidden
      />

      {/* Concentric rings (rendered via the .pp-orb ::before/::after) */}
      <div
        className={`pp-orb ${speakingMod}`}
        style={{ width: size, height: size }}
        aria-hidden
      />

      {/* Speaking indicator: faint waveform dots around perimeter */}
      {state === "speaking" ? (
        <div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            boxShadow:
              "0 0 60px rgba(236,67,87,0.6), 0 0 120px rgba(236,67,87,0.4), inset 0 0 30px rgba(255,255,255,0.1)",
          }}
          aria-hidden
        />
      ) : null}
    </div>
  );
}
