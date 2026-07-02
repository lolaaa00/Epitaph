"use client";

import { GENLAYER_CHAIN_ID } from "@/lib/constants";
import { useRpcStatus } from "@/lib/rpcQueue";

export function ChainStatus() {
  const rpcStatus = useRpcStatus();

  if (rpcStatus.busy) {
    return (
      <div className="flex items-center gap-2 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-gold">
        <span
          className="h-[5px] w-[5px] rounded-full bg-gold shadow-[0_0_8px_var(--gold)]"
          style={{ animation: "pulse-dot 1s ease-in-out infinite" }}
        />
        {rpcStatus.message}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-dust">
      <span
        className="h-[5px] w-[5px] rounded-full bg-verdigris shadow-[0_0_8px_var(--verdigris)]"
        style={{ animation: "pulse-dot 3s ease-in-out infinite" }}
      />
      StudioNet · {GENLAYER_CHAIN_ID} · Active
    </div>
  );
}
