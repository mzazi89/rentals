import { ReportBuilder } from "@/components/report-builder";

export const metadata = { title: "Reports" };

export default function AdminReportsPage() {
  return (
    <ReportBuilder
      scope="admin"
      title="Platform reports"
      description="Platform-wide reporting."
      reports={[
        { id: "users", label: "Users" },
        { id: "properties", label: "Properties" },
        { id: "payments", label: "Payments" },
        { id: "commissions", label: "Commissions" },
      ]}
    />
  );
}
