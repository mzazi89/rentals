"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button, Field, Select } from "@/components/ui/core";
import { Dialog } from "@/components/ui/overlays";
import { useToast } from "@/components/ui/feedback";
import { getVerifiedAgentsOptions } from "@/app/actions/data";
import { assignAgentToProperty } from "@/app/actions/landlord";

export function AssignAgentForm({ propertyId }: { propertyId: string }) {
  const [open, setOpen] = React.useState(false);
  const [agents, setAgents] = React.useState<{ id: string; name: string }[]>([]);
  const [selected, setSelected] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  React.useEffect(() => {
    if (!open) return;
    getVerifiedAgentsOptions().then(setAgents).catch(() => {});
  }, [open]);

  const assign = async () => {
    if (!selected) return;
    setSaving(true);
    const result = await assignAgentToProperty({ propertyId, agentId: selected });
    if (result.ok) {
      toast("Agent assigned", "success");
      setOpen(false);
      router.refresh();
    } else {
      toast(result.error ?? "Could not assign agent.", "error");
    }
    setSaving(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium text-primary hover:bg-muted"
      >
        <UserPlus className="size-3.5" /> Assign agent
      </button>
      <Dialog open={open} onOpenChange={setOpen} title="Assign an agent" description="Choose a verified agent to manage this property.">
        <div className="space-y-4">
          <Field label="Agent">
            <Select value={selected} onChange={(e) => setSelected(e.target.value)}>
              <option value="">Select agent…</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Select>
          </Field>
          <Button className="w-full" onClick={assign} loading={saving} disabled={!selected}>
            Assign agent
          </Button>
        </div>
      </Dialog>
    </>
  );
}
