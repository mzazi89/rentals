import { ReportBuilder } from "@/components/report-builder";

export const metadata = { title: "Reports" };

export default function LandlordReportsPage() {
  return (
    <ReportBuilder
      scope="landlord"
      title="Reports"
      description="Generate reports about your properties and income."
      reports={[
        { id: "rent", label: "Rent collection" },
        { id: "occupancy", label: "Occupancy" },
        { id: "payment", label: "Payments" },
      ]}
    />
  );
}
