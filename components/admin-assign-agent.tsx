"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/core";
import { useToast } from "@/components/ui/feedback";
import { assignAgentToProperty } from "@/app/actions/landlord";

/** Owner console: assign a verified agent to manage a property. */
export function AdminAssignAgent({
  propertyId,
  currentAgentId,
  agents,
}: {
  propertyId: string;
  currentAgentId?: string | null;
  agents: { id: string; name: string }[];
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [agentId, setAgentId] = React.useState(currentAgentId ?? "");
  const [busy, setBusy] = React.useState(false);

  const assign = async () => {
    if (!agentId) return;
    setBusy(true);
    const result = await assignAgentToProperty({ propertyId, agentId });
    if (result.ok) {
      toast("Agent assigned", "success");
      router.refresh();
    } else {
      toast(result.error ?? "Could not assign agent.", "error");
    }
    setBusy(false);
  };

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={agentId}
        onChange={(e) => setAgentId(e.target.value)}
        aria-label="Assign agent"
        className="h-8 w-44 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">— unassigned —</option>
        {agents.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      <Button size="sm" variant="outline" onClick={assign} disabled={busy || !agentId}>
        <UserPlus className="size-3.5" /> Assign
      </Button>
    </div>
  );
}
