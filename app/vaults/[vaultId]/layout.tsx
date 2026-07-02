import { VaultTabs } from "@/components/VaultTabs";

export default async function VaultLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ vaultId: string }>;
}) {
  const { vaultId } = await params;
  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-12 py-12">
      <VaultTabs vaultId={vaultId} />
      {children}
    </div>
  );
}
