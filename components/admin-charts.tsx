"use client";

import * as React from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/layout";
import { getAdminAnalytics } from "@/app/actions/data";

const RANGES = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "365", label: "1 year" },
];

export function AdminCharts({ range }: { range: number }) {
  const [userSeries, setUserSeries] = React.useState<{ date: string; users: number; properties: number }[]>([]);
  const [paymentSeries, setPaymentSeries] = React.useState<{ date: string; payments: number; revenue: number }[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    getAdminAnalytics(range)
      .then((series) => {
        setUserSeries(series.users);
        setPaymentSeries(series.payments);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [range]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Analytics</h2>
        <div className="flex gap-1 rounded-lg border p-1">
          {RANGES.map((r) => (
            <Link
              key={r.value}
              href={`/admin?range=${r.value}`}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                String(range) === r.value ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>New users & properties</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="skeleton h-64" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={userSeries} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="users" name="New users" stroke="#1d4ed8" fill="#1d4ed833" />
                  <Area type="monotone" dataKey="properties" name="New properties" stroke="#ea580c" fill="#ea580c22" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Payments & revenue (KSh thousands)</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="skeleton h-64" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={paymentSeries} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="payments" name="Transactions" fill="#1d4ed8" />
                  <Bar dataKey="revenue" name="Revenue (KSh '000)" fill="#16a34a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
