"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/core";
import { useToast } from "@/components/ui/feedback";
import { assignPropertyLandlord } from "@/app/actions/admin";

/** Owner console: assign a building to a landlord (owner_id). */
export function AdminAssignLandlord({
  propertyId,
  currentLandlordId,
  landlords,
}: {
  propertyId: string;
  currentLandlordId?: string | null;
  landlords: { id: string; name: string; verified: boolean }[];
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [landlordId, setLandlordId] = React.useState(currentLandlordId ?? "");
  const [busy, setBusy] = React.useState(false);

  const assign = async () => {
    if (!landlordId) return;
    setBusy(true);
    const result = await assignPropertyLandlord({ propertyId, landlordId });
    if (result.ok) {
      toast("Landlord assigned", "success");
      router.refresh();
    } else {
      toast(result.error ?? "Could not assign landlord.", "error");
    }
    setBusy(false);
  };

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={landlordId}
        onChange={(e) => setLandlordId(e.target.value)}
        aria-label="Assign landlord"
        className="h-8 w-44 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">— no landlord —</option>
        {landlords.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
            {l.verified ? "" : " (pending)"}
          </option>
        ))}
      </select>
      <Button size="sm" variant="outline" onClick={assign} disabled={busy || !landlordId}>
        <Building2 className="size-3.5" /> Assign
      </Button>
    </div>
  );
}
