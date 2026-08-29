"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, MoreHorizontal, Eye, Pencil, Power, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownItem } from "@/components/ui/overlays";
import { ConfirmDialog } from "@/components/ui/overlays";
import { useToast } from "@/components/ui/feedback";
import { deleteProperty, deactivateProperty } from "@/app/actions/properties";

export function PropertyActions({
  propertyId,
  status,
  slug,
  manageHref,
}: {
  propertyId: string;
  status: string;
  slug: string;
  manageHref?: string;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const doDelete = async () => {
    setBusy(true);
    const result = await deleteProperty(propertyId);
    if (result.ok) {
      toast("Property deleted", "success");
      router.refresh();
    } else {
      toast(result.error ?? "Could not delete.", "error");
    }
    setBusy(false);
    setConfirmDelete(false);
  };

  const doDeactivate = async () => {
    const result = await deactivateProperty(propertyId);
    if (result.ok) {
      toast(status === "inactive" ? "Property reactivated" : "Property deactivated", "success");
      router.refresh();
    } else {
      toast(result.error ?? "Could not update.", "error");
    }
  };

  return (
    <>
      <DropdownMenu
        trigger={<MoreHorizontal className="size-4" />}
        className="right-0"
      >
        {() => (
          <>
            <DropdownItem onClick={() => window.open(`/properties/${slug}`, "_blank")}>
              <Eye className="size-4" /> View
            </DropdownItem>
            <Link href={`/dashboard/agent/properties/${propertyId}/edit`} className="block">
              <DropdownItem>
                <Pencil className="size-4" /> Edit
              </DropdownItem>
            </Link>
            {manageHref ? (
              <Link href={manageHref} className="block">
                <DropdownItem>
                  <Building2 className="size-4" /> Units & structure
                </DropdownItem>
              </Link>
            ) : null}
            <DropdownItem onClick={doDeactivate}>
              <Power className="size-4" /> {status === "inactive" ? "Activate" : "Deactivate"}
            </DropdownItem>
            <DropdownItem destructive onClick={() => setConfirmDelete(true)}>
              <Trash2 className="size-4" /> Delete
            </DropdownItem>
          </>
        )}
      </DropdownMenu>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this property?"
        description="This permanently removes the listing and its images. This action cannot be undone."
        confirmLabel="Delete property"
        loading={busy}
        onConfirm={doDelete}
      />
    </>
  );
}
