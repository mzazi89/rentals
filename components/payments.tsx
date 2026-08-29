"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/core";
import { useToast } from "@/components/ui/feedback";
import { payFor } from "@/app/actions/payments";
import type { PaymentType } from "@/types";

/**
 * Universal payment button. Calls the server action `payFor`, which
 * creates the payment record and returns the provider's authorization
 * URL (Paystack checkout / mock flow). The tenant is redirected there.
 */
export function PayButton({
  amount,
  paymentType,
  propertyId,
  leaseId,
  rentRecordId,
  applicationId,
  label,
  variant = "default",
  className,
}: {
  amount: number;
  paymentType: PaymentType;
  propertyId?: string;
  leaseId?: string;
  rentRecordId?: string;
  applicationId?: string;
  label?: string;
  variant?: "default" | "outline" | "accent";
  className?: string;
}) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handle = async () => {
    if (amount <= 0) {
      toast("Invalid amount.", "error");
      return;
    }
    setLoading(true);
    try {
      const result = await payFor({
        amount,
        paymentType,
        propertyId,
        leaseId,
        rentRecordId,
        applicationId,
      });
      if (!result.ok) {
        toast(result.error ?? "Could not start payment.", "error");
        setLoading(false);
        router.refresh();
        return;
      }
      const authorizationUrl = result.authorizationUrl as string | undefined;
      if (authorizationUrl) {
        window.location.href = authorizationUrl;
      } else {
        toast("Payment could not be started.", "error");
        setLoading(false);
      }
    } catch {
      toast("Something went wrong. Please try again.", "error");
      setLoading(false);
    }
  };

  return (
    <Button variant={variant} onClick={handle} loading={loading} className={className}>
      <CreditCard className="size-4" />
      {label ?? `Pay ${paymentType.replace("_", " ")}`}
    </Button>
  );
}
