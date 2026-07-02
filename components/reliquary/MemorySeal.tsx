"use client";

import { motion } from "framer-motion";
import type { VaultState } from "@/lib/constants";

const STATE_COPY: Record<VaultState, string> = {
  UNSEALED: "Unsealed",
  COLLECTING: "Collecting Fragments",
  AWAITING_CONSENSUS: "Awaiting Consensus",
  INSCRIBED: "Inscribed",
  DISPUTED: "Disputed",
  RECONCILED: "Reconciled",
  SEALED: "Sealed",
  UNDETERMINED: "Undetermined",
};

const STATE_COLOR: Record<VaultState, string> = {
  UNSEALED: "var(--dust)",
  COLLECTING: "var(--gold)",
  AWAITING_CONSENSUS: "var(--blue)",
  INSCRIBED: "var(--gold)",
  DISPUTED: "var(--rust-2)",
  RECONCILED: "var(--blue)",
  SEALED: "var(--gold-3)",
  UNDETERMINED: "var(--violet)",
};

export function MemorySeal({
  state,
  size = 140,
}: {
  state: VaultState;
  size?: number;
}) {
  const color = STATE_COLOR[state] ?? "var(--dust)";
  const r = size / 2 - 8;
  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
          {/* outer ring — broken for UNSEALED, full otherwise */}
          <circle
            cx={center}
            cy={center}
            r={r}
            fill="none"
            stroke={color}
            strokeOpacity={0.25}
            strokeWidth={1.2}
            strokeDasharray={state === "UNSEALED" ? "10 14" : undefined}
          />

          {/* inner glow disc */}
          <circle cx={center} cy={center} r={r - 14} fill={color} opacity={0.05} />

          {/* state-specific ring treatment */}
          {state === "COLLECTING" && (
            <>
              {[0, 1, 2].map((i) => (
                <motion.circle
                  key={i}
                  cx={center}
                  cy={center - r + 18}
                  r={3}
                  fill={color}
                  style={{ transformOrigin: `${center}px ${center}px` }}
                  animate={{ rotate: 360 }}
                  transition={{
                    repeat: Infinity,
                    duration: 6 + i * 2,
                    ease: "linear",
                    delay: i * 0.6,
                  }}
                />
              ))}
            </>
          )}

          {state === "AWAITING_CONSENSUS" && (
            <motion.circle
              cx={center}
              cy={center}
              r={r - 6}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeDasharray={`${r * 1.2} ${r * 5}`}
              animate={{ rotate: 360 }}
              style={{ transformOrigin: `${center}px ${center}px` }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            />
          )}

          {(state === "INSCRIBED" || state === "SEALED") && (
            <circle
              cx={center}
              cy={center}
              r={r - 6}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
              opacity={0.7}
            />
          )}

          {state === "DISPUTED" && (
            <g stroke="var(--rust-2)" strokeWidth={1} opacity={0.8}>
              <line x1={center - r + 10} y1={center - 8} x2={center + 6} y2={center + r - 14} />
              <line x1={center + r - 16} y1={center - r + 16} x2={center - 10} y2={center + 4} />
              <line x1={center - 6} y1={center - r + 8} x2={center + r - 20} y2={center + r - 18} />
            </g>
          )}

          {state === "RECONCILED" && (
            <g stroke="var(--blue)" strokeWidth={1.4} opacity={0.75}>
              <path
                d={`M ${center - r + 14} ${center} Q ${center} ${center - 20} ${center + r - 14} ${center}`}
                fill="none"
              />
              <path
                d={`M ${center - r + 14} ${center + 8} Q ${center} ${center + 28} ${center + r - 14} ${center + 8}`}
                fill="none"
              />
            </g>
          )}

          {state === "UNDETERMINED" && (
            <motion.circle
              cx={center}
              cy={center}
              r={r - 10}
              fill="none"
              stroke="var(--violet)"
              strokeWidth={1.4}
              opacity={0.6}
              animate={{ scale: [1, 1.06, 0.97, 1] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              style={{ transformOrigin: `${center}px ${center}px` }}
            />
          )}
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-serif text-2xl"
            style={{ color }}
          >
            ✦
          </span>
        </div>
      </div>
      <div
        className="font-mono text-[0.6rem] uppercase tracking-[0.16em]"
        style={{ color }}
      >
        {STATE_COPY[state] ?? state}
      </div>
    </div>
  );
}
