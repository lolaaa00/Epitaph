import Link from "next/link";

const SECTIONS = [
  {
    title: "The Problem With Memory",
    body: "When a person dies, the record of who they were is left to whoever speaks loudest, first, or longest. A single family member should not fully control a legacy. A single critic should not destroy one.",
  },
  {
    title: "When Families Disagree",
    body: "Grief produces contradiction. One relative remembers generosity; another remembers absence. A deterministic ledger can store both claims — it cannot decide which belongs in the public record.",
  },
  {
    title: "When Communities Remember Differently",
    body: "Local memory and institutional memory rarely agree. Someone quietly influential in one place can be invisible everywhere else. EPITAPH preserves the gap instead of erasing it.",
  },
  {
    title: "Why Deterministic Contracts Fail",
    body: "A normal smart contract can store a name, a date, a hash. It cannot weigh testimony against contradiction, or decide whether the absence of documentation diminishes decades of lived contribution.",
  },
  {
    title: "How Consensus Creates an Inscription",
    body: "Validators independently interpret the submitted evidence — writings, testimonials, counter-context — and reach agreement on the essential shape of a legacy, not on identical prose.",
  },
  {
    title: "Disputes Become Fractures, Not Deletions",
    body: "A challenge never simply removes a memory. It produces a Fracture, adjudicated by consensus into a resolution: upheld, revised, contested, or split into multiple interpretations.",
  },
  {
    title: "The Archive Remains Challengeable",
    body: "Even a sealed vault carries its full history of evidence, dispute, and revision. EPITAPH does not produce a final verdict — it produces an argued, inspectable memory.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center text-center px-6 sm:px-12 py-32">
        <div className="marble-veins absolute inset-0 pointer-events-none" />
        <div className="hero-label font-mono text-[0.65rem] tracking-[0.28em] uppercase text-dust mb-14 flex items-center gap-4">
          <span className="w-12 h-px bg-gradient-to-r from-transparent to-gold/30" />
          A GenLayer Legacy Preservation Protocol
          <span className="w-12 h-px bg-gradient-to-l from-transparent to-gold/30" />
        </div>
        <h1 className="font-serif uppercase tracking-[0.2em] text-[clamp(3rem,13vw,9rem)] leading-none gold-shimmer mb-6">
          Epitaph
        </h1>
        <p className="font-serif italic text-[clamp(1rem,2.2vw,1.4rem)] text-parchment mb-10 max-w-xl">
          Every life becomes a story.
          <br />
          EPITAPH asks who gets to write it.
        </p>
        <p className="font-sans text-sm text-dust max-w-md mb-10 leading-relaxed">
          A decentralized legacy preservation protocol where evidence, memory,
          contradiction, and consensus form a public inscription of how a
          person should be remembered.
        </p>
        <div className="w-20 h-px bg-gradient-to-r from-transparent via-gold to-transparent mb-10" />
        <div className="flex gap-6 flex-wrap justify-center">
          <Link href="/vaults/new" className="btn-archive">
            Open a Legacy Vault
          </Link>
          <Link href="/vaults" className="btn-explore">
            Enter the Archive
          </Link>
        </div>
      </section>

      <div className="h-px mx-12 bg-gradient-to-r from-transparent via-gold/15 to-transparent" />

      {/* WHY SECTIONS */}
      <section className="max-w-5xl mx-auto px-6 sm:px-12 py-24 grid sm:grid-cols-2 gap-12">
        {SECTIONS.map((s) => (
          <div key={s.title} className="flex flex-col gap-3">
            <h3 className="font-serif text-xl text-bone">{s.title}</h3>
            <p className="font-sans text-sm text-dust leading-relaxed">{s.body}</p>
          </div>
        ))}
      </section>

      <div className="h-px mx-12 bg-gradient-to-r from-transparent via-gold/15 to-transparent" />

      {/* NORTH STAR */}
      <section className="max-w-3xl mx-auto px-6 sm:px-12 py-28 text-center">
        <h2 className="font-serif text-[clamp(1.8rem,4vw,2.75rem)] text-bone leading-tight mb-6">
          A normal smart contract preserves a{" "}
          <span className="gold-word">hash.</span>
          <br />
          EPITAPH preserves an <span className="gold-word">argued memory.</span>
        </h2>
        <p className="font-serif italic text-parchment mb-12">
          The contract is not deciding whether someone was good or bad. It is
          deciding how the submitted evidence supports a fair public memory.
        </p>
        <Link href="/vaults/new" className="btn-archive">
          Enshrine a Memory
        </Link>
      </section>

      <footer className="flex items-center justify-between px-6 sm:px-12 py-10 border-t border-gold/[0.06]">
        <div className="font-serif text-sm tracking-[0.2em] uppercase text-dust">Epitaph</div>
        <div className="font-mono text-[0.575rem] tracking-[0.12em] uppercase text-dust/50">
          GenLayer Legacy Protocol · StudioNet · Memory Reliquary v1.0
        </div>
      </footer>
    </div>
  );
}
