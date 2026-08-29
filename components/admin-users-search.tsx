"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function AdminUsersSearch({ currentQ, currentRole }: { currentQ: string; currentRole: string }) {
  const router = useRouter();
  const [q, setQ] = React.useState(currentQ);
  const [role, setRole] = React.useState(currentRole);

  React.useEffect(() => {
    setQ(currentQ);
    setRole(currentRole);
  }, [currentQ, currentRole]);

  const apply = () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (role) params.set("role", role);
    router.push(`/admin/users?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="Search name or email…"
          className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <select
        value={role}
        onChange={(e) => {
          setRole(e.target.value);
          const params = new URLSearchParams();
          if (q) params.set("q", q);
          if (e.target.value) params.set("role", e.target.value);
          router.push(`/admin/users?${params.toString()}`);
        }}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="">All roles</option>
        <option value="tenant">Tenants</option>
        <option value="agent">Agents</option>
        <option value="landlord">Landlords</option>
        <option value="admin">Admins</option>
      </select>
      <button onClick={apply} className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
        Search
      </button>
    </div>
  );
}
