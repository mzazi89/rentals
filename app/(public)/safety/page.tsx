import { AlertTriangle, BadgeCheck, CreditCard, Eye, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/layout";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Rental safety guide",
  description: "How to stay safe when searching, viewing and paying for rentals on RentHub.",
  path: "/safety",
});

export default function SafetyPage() {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold">Rental safety guide</h1>
      <p className="mt-2 text-muted-foreground">
        Keep these tips in mind throughout your rental journey.
      </p>

      <div className="mt-8 space-y-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
              <div>
                <h2 className="font-semibold">Never send money outside the platform</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  If anyone asks you to pay via M-Pesa, bank transfer or cash directly to them
                  instead of through RentHub, stop and report them immediately. Scammers often
                  ask for "reservation fees" on fake listings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <BadgeCheck className="mt-0.5 size-5 shrink-0 text-success" />
              <div>
                <h2 className="font-semibold">Check verification badges</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Prefer verified agents and verified properties. Our team screens agents'
                  identification and agency details before verification.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Eye className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <h2 className="font-semibold">Always view before you pay</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Book a viewing and physically inspect the property before paying any deposit
                  or signing a lease. Meet the agent in a public place if you're unsure.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <CreditCard className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <h2 className="font-semibold">Pay only through RentHub</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  In-platform payments are verified and you'll receive a receipt. Off-platform
                  payments cannot be protected or recovered.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" />
              <div>
                <h2 className="font-semibold">Report suspicious activity</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use the report button on any property or agent profile. Our moderation team
                  investigates every report.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
