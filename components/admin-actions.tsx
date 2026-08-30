"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Ban, Check, Eye, EyeOff, RotateCcw, Star, Trash2 } from "lucide-react";
import { Button, Field, Input } from "@/components/ui/core";
import { Dialog, ConfirmDialog, DropdownMenu, DropdownItem } from "@/components/ui/overlays";
import { useToast } from "@/components/ui/feedback";
import {
  verifyAgent,
  verifyLandlord,
  decideProperty,
  suspendUser,
  reactivateUser,
  deleteUser,
  adminSetRole,
  resolveReport,
  moderateReview,
  updateCommissionStatus,
  setFeaturedProperty,
} from "@/app/actions/admin";

/* ------------------------------------------------------------------ */
/* User management                                                    */
/* ------------------------------------------------------------------ */
export function AdminUserActions({
  userId,
  status,
  isAdmin,
  currentRole,
}: {
  userId: string;
  status: string;
  isAdmin: boolean;
  currentRole?: string | null;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [confirm, setConfirm] = React.useState<null | "suspend" | "delete">(null);
  const [busy, setBusy] = React.useState(false);
  const [role, setRole] = React.useState(currentRole ?? "");

  const run = async (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string) => {
    setBusy(true);
    const result = await fn();
    if (result.ok) {
      toast(msg, "success");
      router.refresh();
    } else {
      toast(result.error ?? "Action failed.", "error");
    }
    setBusy(false);
    setConfirm(null);
  };

  const setUserRole = async () => {
    if (!role || role === currentRole) return;
    setBusy(true);
    const result = await adminSetRole({ userId, role: role as "tenant" | "agent" | "landlord" });
    if (result.ok) {
      toast("Role assigned — user now signs in directly", "success");
      router.refresh();
    } else {
      toast(result.error ?? "Could not set role.", "error");
    }
    setBusy(false);
  };

  if (isAdmin) return null;

  return (
    <>
      <div className="mb-1.5 flex items-center gap-1.5">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          aria-label="Set role"
          className="h-8 w-36 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">— set role —</option>
          <option value="tenant">Tenant</option>
          <option value="agent">Agent</option>
          <option value="landlord">Landlord</option>
        </select>
        <Button size="sm" variant="outline" onClick={setUserRole} disabled={busy || !role || role === currentRole}>
          <Check className="size-3.5" /> Save
        </Button>
      </div>
      <DropdownMenu trigger={<Button size="sm" variant="outline">Actions</Button>}>
        {() => (
          <>
            {status === "active" ? (
              <DropdownItem onClick={() => setConfirm("suspend")}>
                <Ban className="size-4" /> Suspend
              </DropdownItem>
            ) : (
              <DropdownItem onClick={() => run(() => reactivateUser(userId), "User reactivated")}>
                <RotateCcw className="size-4" /> Reactivate
              </DropdownItem>
            )}
            <DropdownItem destructive onClick={() => setConfirm("delete")}>
              <Trash2 className="size-4" /> Delete
            </DropdownItem>
          </>
        )}
      </DropdownMenu>

      <ConfirmDialog
        open={confirm === "suspend"}
        onOpenChange={(v) => !v && setConfirm(null)}
        title="Suspend this user?"
        description="The user will not be able to sign in or use the platform until reactivated."
        confirmLabel="Suspend user"
        loading={busy}
        onConfirm={() => run(() => suspendUser(userId), "User suspended")}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        onOpenChange={(v) => !v && setConfirm(null)}
        title="Delete this user?"
        description="This permanently deletes the account and all associated data. This action cannot be undone."
        confirmLabel="Delete user"
        loading={busy}
        onConfirm={() => run(() => deleteUser(userId), "User deleted")}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Agent verification                                                 */
/* ------------------------------------------------------------------ */
export function AgentVerifyActions({ agentId, status }: { agentId: string; status: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [noteOpen, setNoteOpen] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [noteAction, setNoteAction] = React.useState<"reject" | "request_info">("reject");

  const act = async (action: "approve" | "reject" | "request_info") => {
    setBusy(action);
    const result = await verifyAgent({ agentId, action, note: action === "approve" ? undefined : note || undefined });
    if (result.ok) {
      toast("Agent verification updated", "success");
      router.refresh();
    } else {
      toast(result.error ?? "Could not update.", "error");
    }
    setBusy(null);
  };

  const openNote = (action: "reject" | "request_info") => {
    setNoteAction(action);
    setNote("");
    setNoteOpen(true);
  };

  return (
    <>
      {status === "pending" || status === "info_requested" ? (
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant="success" loading={busy === "approve"} onClick={() => act("approve")}>
            <Check className="size-3.5" /> Approve
          </Button>
          <Button size="sm" variant="outline" onClick={() => openNote("request_info")}>Request info</Button>
          <Button size="sm" variant="destructive" onClick={() => openNote("reject")}>Reject</Button>
        </div>
      ) : (
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" onClick={() => openNote("request_info")}>Request info</Button>
        </div>
      )}

      <Dialog open={noteOpen} onOpenChange={setNoteOpen} title={noteAction === "reject" ? "Reject agent" : "Request more information"} description="Add a note for the agent.">
        <div className="space-y-4">
          <Field label="Note">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Please upload a clear ID photo" />
          </Field>
          <Button
            variant={noteAction === "reject" ? "destructive" : "default"}
            className="w-full"
            onClick={() => {
              setNoteOpen(false);
              void act(noteAction);
            }}
          >
            {noteAction === "reject" ? "Reject agent" : "Request information"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Landlord verification (owner)                                      */
/* ------------------------------------------------------------------ */
export function LandlordVerifyActions({ landlordId, status }: { landlordId: string; status: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [noteOpen, setNoteOpen] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [noteAction, setNoteAction] = React.useState<"reject" | "request_info">("reject");

  const act = async (action: "approve" | "reject" | "request_info") => {
    setBusy(action);
    const result = await verifyLandlord({
      landlordId,
      action,
      note: action === "approve" ? undefined : note || undefined,
    });
    if (result.ok) {
      toast("Landlord verification updated", "success");
      router.refresh();
    } else {
      toast(result.error ?? "Could not update.", "error");
    }
    setBusy(null);
  };

  const openNote = (action: "reject" | "request_info") => {
    setNoteAction(action);
    setNote("");
    setNoteOpen(true);
  };

  return (
    <>
      {status === "pending" || status === "info_requested" ? (
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant="success" loading={busy === "approve"} onClick={() => act("approve")}>
            <Check className="size-3.5" /> Approve
          </Button>
          <Button size="sm" variant="outline" onClick={() => openNote("request_info")}>Request info</Button>
          <Button size="sm" variant="destructive" onClick={() => openNote("reject")}>Reject</Button>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={() => openNote("request_info")}>Request info</Button>
      )}

      <Dialog open={noteOpen} onOpenChange={setNoteOpen} title={noteAction === "reject" ? "Reject landlord" : "Request more information"} description="Add a note for the landlord.">
        <div className="space-y-4">
          <Field label="Note">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Please upload proof of ownership" />
          </Field>
          <Button
            variant={noteAction === "reject" ? "destructive" : "default"}
            className="w-full"
            onClick={() => {
              setNoteOpen(false);
              void act(noteAction);
            }}
          >
            {noteAction === "reject" ? "Reject landlord" : "Request information"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Property decision                                                  */
/* ------------------------------------------------------------------ */
export function PropertyDecisionActions({ propertyId, status }: { propertyId: string; status: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [noteOpen, setNoteOpen] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [noteAction, setNoteAction] = React.useState<"reject" | "request_changes">("reject");

  const act = async (action: "approve" | "reject" | "request_changes") => {
    setBusy(action);
    const result = await decideProperty({
      propertyId,
      action,
      note: action === "approve" ? undefined : note || undefined,
    });
    if (result.ok) {
      toast("Property updated", "success");
      router.refresh();
    } else {
      toast(result.error ?? "Could not update.", "error");
    }
    setBusy(null);
  };

  const openNote = (action: "reject" | "request_changes") => {
    setNoteAction(action);
    setNote("");
    setNoteOpen(true);
  };

  if (status === "pending_review" || status === "draft") {
    return (
      <>
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant="success" loading={busy === "approve"} onClick={() => act("approve")}>
            <Check className="size-3.5" /> Approve
          </Button>
          <Button size="sm" variant="outline" onClick={() => openNote("request_changes")}>Request changes</Button>
          <Button size="sm" variant="destructive" onClick={() => openNote("reject")}>Reject</Button>
        </div>
        <Dialog open={noteOpen} onOpenChange={setNoteOpen} title={noteAction === "reject" ? "Reject listing" : "Request changes"} description="Add a note for the agent.">
          <div className="space-y-4">
            <Field label="Note">
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What needs to change?" />
            </Field>
            <Button
              variant={noteAction === "reject" ? "destructive" : "default"}
              className="w-full"
              onClick={() => {
                setNoteOpen(false);
                void act(noteAction);
              }}
            >
              Confirm
            </Button>
          </div>
        </Dialog>
      </>
    );
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Featured toggle                                                    */
/* ------------------------------------------------------------------ */
export function FeaturedToggle({ propertyId, featured }: { propertyId: string; featured: boolean }) {
  const { toast } = useToast();
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  const toggle = async () => {
    setBusy(true);
    const result = await setFeaturedProperty({ propertyId, featured: !featured });
    if (result.ok) {
      toast(featured ? "Removed from featured" : "Marked as featured", "success");
      router.refresh();
    } else {
      toast(result.error ?? "Could not update.", "error");
    }
    setBusy(false);
  };

  return (
    <Button size="sm" variant={featured ? "accent" : "outline"} loading={busy} onClick={toggle}>
      <Star className={featured ? "size-3.5 fill-current" : "size-3.5"} /> {featured ? "Featured" : "Feature"}
    </Button>
  );
}

/* ------------------------------------------------------------------ */
/* Reports / reviews / commissions                                    */
/* ------------------------------------------------------------------ */
export function ReportResolveActions({ reportId, status }: { reportId: string; status: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);

  const act = async (next: string) => {
    setBusy(next);
    const result = await resolveReport({ reportId, status: next as "open" | "investigating" | "resolved" | "dismissed" });
    if (result.ok) {
      toast("Report updated", "success");
      router.refresh();
    } else {
      toast(result.error ?? "Could not update.", "error");
    }
    setBusy(null);
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {status === "open" ? (
        <Button size="sm" variant="outline" loading={busy === "investigating"} onClick={() => act("investigating")}>
          <Eye className="size-3.5" /> Investigate
        </Button>
      ) : null}
      <Button size="sm" variant="success" loading={busy === "resolved"} onClick={() => act("resolved")}>
        <Check className="size-3.5" /> Resolve
      </Button>
      <Button size="sm" variant="ghost" loading={busy === "dismissed"} onClick={() => act("dismissed")}>
        <EyeOff className="size-3.5" /> Dismiss
      </Button>
    </div>
  );
}

export function ReviewModerateActions({ reviewId, status }: { reviewId: string; status: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  const act = async (action: "approve" | "hide") => {
    setBusy(true);
    const result = await moderateReview({ reviewId, action });
    if (result.ok) {
      toast("Review updated", "success");
      router.refresh();
    } else {
      toast(result.error ?? "Could not update.", "error");
    }
    setBusy(false);
  };

  return (
    <div className="flex gap-1.5">
      {status === "pending" || status === "hidden" ? (
        <Button size="sm" variant="success" loading={busy} onClick={() => act("approve")}>
          <Check className="size-3.5" /> Approve
        </Button>
      ) : null}
      {status !== "hidden" ? (
        <Button size="sm" variant="ghost" loading={busy} onClick={() => act("hide")}>
          <EyeOff className="size-3.5" /> Hide
        </Button>
      ) : null}
    </div>
  );
}

export function CommissionStatusActions({ commissionId, status }: { commissionId: string; status: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);

  const act = async (next: string) => {
    setBusy(next);
    const result = await updateCommissionStatus({ commissionId, status: next as "pending" | "approved" | "paid" | "cancelled" });
    if (result.ok) {
      toast("Commission updated", "success");
      router.refresh();
    } else {
      toast(result.error ?? "Could not update.", "error");
    }
    setBusy(null);
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {status === "pending" ? (
        <Button size="sm" variant="success" loading={busy === "approved"} onClick={() => act("approved")}>
          Approve
        </Button>
      ) : null}
      {status === "approved" ? (
        <Button size="sm" variant="accent" loading={busy === "paid"} onClick={() => act("paid")}>
          Mark paid
        </Button>
      ) : null}
      {["pending", "approved"].includes(status) ? (
        <Button size="sm" variant="ghost" loading={busy === "cancelled"} onClick={() => act("cancelled")}>
          Cancel
        </Button>
      ) : null}
    </div>
  );
}
