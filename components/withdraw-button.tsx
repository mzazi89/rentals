"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/core";
import { useToast } from "@/components/ui/feedback";
import { withdrawApplication } from "@/app/actions/applications";

export function WithdrawButton({ applicationId }: { applicationId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const withdraw = async () => {
    setLoading(true);
    const result = await withdrawApplication(applicationId);
    if (result.ok) {
      toast("Application withdrawn", "success");
      router.refresh();
    } else {
      toast(result.error ?? "Could not withdraw.", "error");
    }
    setLoading(false);
  };

  return (
    <Button size="sm" variant="outline" loading={loading} onClick={withdraw}>
      Withdraw
    </Button>
  );
}
