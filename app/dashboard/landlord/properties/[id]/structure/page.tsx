import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireProfile } from "@/lib/auth/helpers";
import { db } from "@/db";
import { fetchFloorsWithUnits } from "@/lib/db/queries";
import { PageHeader } from "@/components/dashboard";
import { UnitManager } from "@/components/unit-manager";
import { Card, CardContent } from "@/components/ui/layout";

export const metadata = { title: "Building structure" };

export default async function LandlordStructurePage({ params }: { params: { id: string } }) {
  const profile = await requireProfile();

  const property = await db<{ id: string; owner_id: string; agent_id: string | null; title: string }[]>`
    select id, owner_id, agent_id, title from properties where id = ${params.id}
  `;
  const prop = property[0];
  if (!prop) notFound();
  if (prop.owner_id !== profile.id && profile.role !== "owner" && profile.role !== "admin") {
    redirect("/dashboard/landlord");
  }

  const floors = await fetchFloorsWithUnits(params.id);

  return (
    <div>
      <PageHeader
        title="Building structure"
        description={`Add floors and unit numbers for ${prop.title}`}
        actions={
          <Link
            href="/dashboard/landlord/properties"
            className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-muted"
          >
            <ArrowLeft className="size-4" /> Back to properties
          </Link>
        }
      />
      <Card>
        <CardContent className="p-5">
          <UnitManager propertyId={params.id} mode="manage" floors={floors} />
        </CardContent>
      </Card>
    </div>
  );
}
