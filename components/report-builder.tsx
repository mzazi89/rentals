"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/dashboard";
import { Card, CardContent, Table, THead, Th, Td, TRow } from "@/components/ui/layout";
import { Button } from "@/components/ui/core";
import { generateReport, type ReportRow } from "@/app/actions/data";
import { formatDateTime, formatMoney } from "@/lib/utils";

export function ReportBuilder({
  scope,
  title,
  description,
  reports,
}: {
  scope: "agent" | "landlord" | "admin";
  title: string;
  description: string;
  reports: { id: string; label: string }[];
}) {
  const [type, setType] = React.useState(reports[0]?.id ?? "");
  const [rows, setRows] = React.useState<ReportRow[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(
    async (reportType: string) => {
      setLoading(true);
      try {
        setRows(await generateReport(reportType, scope));
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [scope]
  );

  React.useEffect(() => {
    void load(type);
  }, [type, load]);

  const downloadCsv = () => {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const lines = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button onClick={downloadCsv} disabled={rows.length === 0}>
            <Download className="size-4" /> Download CSV
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {reports.map((r) => (
          <button
            key={r.id}
            onClick={() => setType(r.id)}
            aria-pressed={type === r.id}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              type === r.id ? "bg-primary text-primary-foreground" : "border hover:bg-muted"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              <div className="skeleton h-10" />
              <div className="skeleton h-10" />
              <div className="skeleton h-10" />
            </div>
          ) : rows.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">No data for this report yet.</p>
          ) : (
            <Table>
              <THead>
                {Object.keys(rows[0]).map((h) => (
                  <Th key={h}>{h}</Th>
                ))}
              </THead>
              <tbody>
                {rows.slice(0, 200).map((r, i) => (
                  <TRow key={i}>
                    {Object.entries(r).map(([key, value], j) => (
                      <Td key={j}>
                        {typeof value === "number" && /amount|rent|balance|income|due|paid/i.test(key)
                          ? formatMoney(value)
                          : typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)
                            ? formatDateTime(value)
                            : String(value)}
                      </Td>
                    ))}
                  </TRow>
                ))}
              </tbody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
