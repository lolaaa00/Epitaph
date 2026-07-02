import type { ReactNode } from "react";

export function ReliquaryShell({
  left,
  center,
  right,
  header,
}: {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
  header?: ReactNode;
}) {
  return (
    <div className="vault-detail-shell bg-obsidian border border-gold/10 rounded-sm overflow-hidden relative">
      <div className="scan-line-bar absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
      {header && (
        <div className="px-8 sm:px-12 pt-10 pb-8 border-b border-gold/[0.08] bg-gradient-to-b from-gold/[0.04] to-transparent">
          {header}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_1fr] min-h-[460px]">
        <div className="px-7 py-8 border-b md:border-b-0 md:border-r border-gold/[0.07]">
          {left}
        </div>
        <div className="px-8 sm:px-10 py-9">{center}</div>
        <div className="px-7 py-8 border-t md:border-t-0 md:border-l border-gold/[0.07] bg-abyss/30">
          {right}
        </div>
      </div>
    </div>
  );
}

export function PanelLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 font-mono text-[0.575rem] uppercase tracking-[0.22em] text-dust mb-6">
      {children}
      <span className="flex-1 h-px bg-gradient-to-r from-gold/20 to-transparent" />
    </div>
  );
}
