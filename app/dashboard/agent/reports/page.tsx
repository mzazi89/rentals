import { ReportBuilder } from "@/components/report-builder";

export const metadata = { title: "Reports" };

export default function AgentReportsPage() {
  return (
    <ReportBuilder
      scope="agent"
      title="Reports"
      description="Generate reports about your properties, rent and commissions."
      reports={[
        { id: "rent", label: "Rent collection" },
        { id: "occupancy", label: "Occupancy" },
        { id: "payment", label: "Payments" },
        { id: "property", label: "Properties" },
        { id: "commission", label: "Commissions" },
      ]}
    />
  );
}
