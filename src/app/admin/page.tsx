import { DemoBadge } from "@/components/ui/DemoBadge";

export default function AdminOverviewPage() {
  return (
    <div className="flex flex-wrap items-center gap-3 py-6">
      <h1 className="font-headline-lg text-headline-lg text-on-surface">Шарҳи умумӣ</h1>
      <DemoBadge />
    </div>
  );
}
