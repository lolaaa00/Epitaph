import type { LegacyInscription as LegacyInscriptionT } from "@/lib/formatters";

export function LegacyInscription({
  inscription,
}: {
  inscription: LegacyInscriptionT | null;
}) {
  if (!inscription) {
    return (
      <div className="font-serif italic text-sm text-dust">
        No inscription has been carved for this vault yet. The record awaits consensus.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="font-serif text-[1.0625rem] text-bone leading-[1.75]">
        {inscription.legacySummary}
      </div>
      {inscription.contestedLines && (
        <div className="border border-rust-2/25 bg-rust-2/5 rounded-sm px-3 py-2">
          <div className="font-mono text-[0.575rem] uppercase tracking-[0.16em] text-rust-2 mb-1">
            Contested Lines
          </div>
          <div className="font-serif italic text-sm text-parchment">
            {inscription.contestedLines}
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="font-mono text-[0.575rem] uppercase tracking-[0.16em] text-dust mb-1">
            Contribution Assessment
          </div>
          <p className="font-serif italic text-parchment leading-relaxed">
            {inscription.contributionAssessment}
          </p>
        </div>
        <div>
          <div className="font-mono text-[0.575rem] uppercase tracking-[0.16em] text-dust mb-1">
            Historical Profile
          </div>
          <p className="font-serif italic text-parchment leading-relaxed">
            {inscription.historicalProfile}
          </p>
        </div>
      </div>
      <div>
        <div className="font-mono text-[0.575rem] uppercase tracking-[0.16em] text-dust mb-1">
          Reasoning Summary
        </div>
        <p className="font-serif italic text-parchment leading-relaxed text-sm">
          {inscription.reasoningSummary}
        </p>
      </div>
      <div className="font-mono text-[0.6rem] text-dust tracking-[0.08em]">
        Preservation: <span className="text-gold-2">{inscription.preservationRecommendation}</span>
        {" · "}
        Inscription {inscription.inscriptionId}
      </div>
    </div>
  );
}
