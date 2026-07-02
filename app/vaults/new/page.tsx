import { CreateVaultForm } from "@/components/forms/CreateVaultForm";

export default function NewVaultPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 sm:px-12 py-16">
      <div className="mb-3 font-mono text-[0.625rem] uppercase tracking-[0.28em] text-dust flex items-center gap-3">
        <span className="text-gold">·</span> Ritual Intake
      </div>
      <h1 className="font-serif text-[clamp(2rem,5vw,3rem)] font-light text-bone mb-4">
        Open a <span className="gold-word">Legacy Vault</span>
      </h1>
      <p className="font-serif italic text-parchment max-w-lg mb-12">
        A vault cannot be opened empty. State the claim being made about this
        life, and attest the first fragment of evidence behind it.
      </p>

      <CreateVaultForm />
    </div>
  );
}
