"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ClipboardCheck, Flag, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/core";
import { Dialog } from "@/components/ui/overlays";
import { useToast } from "@/components/ui/feedback";
import { authClient } from "@/lib/auth-client";
import { ViewingForm, ApplicationForm, ContactAgentButton } from "@/components/forms";
import { ReportForm } from "@/components/report-form";

export function PropertyDetailActions({
  propertyId,
  agentId,
}: {
  propertyId: string;
  agentId?: string | null;
}) {
  const [dialog, setDialog] = React.useState<null | "viewing" | "apply" | "report">(null);
  const [authed, setAuthed] = React.useState<boolean | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  React.useEffect(() => {
    authClient.getSession().then((session) => setAuthed(Boolean(session.data)));
  }, []);

  const requireAuth = (next: "viewing" | "apply" | "report") => {
    if (!authed) {
      toast("Please sign in to continue.", "info");
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setDialog(next);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {agentId ? <ContactAgentButton agentId={agentId} propertyId={propertyId} /> : null}
        <Button variant="outline" onClick={() => requireAuth("viewing")}>
          <CalendarDays className="size-4" /> Book viewing
        </Button>
        <Button onClick={() => requireAuth("apply")}>
          <ClipboardCheck className="size-4" /> Apply now
        </Button>
        <Button variant="ghost" size="icon" aria-label="Report this property" onClick={() => requireAuth("report")}>
          <Flag className="size-4" />
        </Button>
      </div>

      {/* Mobile sticky action bar */}
      <div className="print-hidden fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 backdrop-blur sm:hidden">
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => requireAuth("viewing")}>
            <CalendarDays className="size-4" /> Book Viewing
          </Button>
          <Button className="flex-1" onClick={() => requireAuth("apply")}>
            <ClipboardCheck className="size-4" /> Apply
          </Button>
        </div>
      </div>

      <Dialog
        open={dialog === "viewing"}
        onOpenChange={(v) => !v && setDialog(null)}
        title="Book a viewing"
        description="Choose a date and time — the agent will confirm."
      >
        <ViewingForm propertyId={propertyId} onDone={() => setDialog(null)} />
      </Dialog>

      <Dialog
        open={dialog === "apply"}
        onOpenChange={(v) => !v && setDialog(null)}
        title="Apply for this property"
        description="Your application goes straight to the agent."
        size="lg"
      >
        <ApplicationForm propertyId={propertyId} onDone={() => setDialog(null)} />
      </Dialog>

      <Dialog
        open={dialog === "report"}
        onOpenChange={(v) => !v && setDialog(null)}
        title="Report this property"
        description="Help us keep RentHub safe. Reports are reviewed by our team."
      >
        <ReportForm propertyId={propertyId} onDone={() => setDialog(null)} />
      </Dialog>
    </>
  );
}
