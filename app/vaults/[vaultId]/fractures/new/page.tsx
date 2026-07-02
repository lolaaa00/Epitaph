"use client";

import { useParams } from "next/navigation";
import { FractureForm } from "@/components/forms/FractureForm";

export default function NewFracturePage() {
  const { vaultId } = useParams<{ vaultId: string }>();

  return (
    <div className="max-w-xl">
      <h2 className="font-serif text-2xl text-bone mb-2">Open a Fracture</h2>
      <p className="font-serif italic text-sm text-parchment mb-10">
        A fracture never deletes a memory. It sends a claim to consensus,
        which adjudicates whether the record should be upheld, revised,
        contested, or split.
      </p>
      <FractureForm vaultId={vaultId} />
    </div>
  );
}
