"use client";

import * as React from "react";
import Link from "next/link";
import { BadgeCheck, MapPin, Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/layout";
import type { Agent } from "@/types";

export interface AgentWithProfileCard extends Partial<Agent> {
  profile?: { id?: string; full_name?: string | null; avatar_url?: string | null; phone?: string | null } | null;
  property_count?: number;
}

export function AgentBadge({ verified, className }: { verified?: boolean; className?: string }) {
  if (!verified) return null;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success", className)}>
      <BadgeCheck className="size-3.5" /> Verified Agent
    </span>
  );
}

export function AgentCard({ agent, className }: { agent: AgentWithProfileCard; className?: string }) {
  const profileId = agent.profile?.id ?? agent.id;
  return (
    <Link
      href={`/agents/${profileId}`}
      className={cn(
        "group flex flex-col items-center rounded-xl border bg-card p-6 text-center shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift",
        className
      )}
    >
      <Avatar src={agent.profile?.avatar_url} name={agent.profile?.full_name} size="lg" />
      <h3 className="mt-3 font-semibold">{agent.profile?.full_name ?? "Agent"}</h3>
      <p className="text-sm text-muted-foreground">{agent.agency_name ?? "Independent agent"}</p>
      <AgentBadge verified={agent.verification_status === "verified"} className="mt-2" />
      {agent.areas_served && agent.areas_served.length > 0 ? (
        <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3" /> {agent.areas_served.slice(0, 3).join(", ")}
        </p>
      ) : null}
      <p className="mt-1 text-xs text-muted-foreground">
        {agent.property_count ?? 0} active listing{agent.property_count === 1 ? "" : "s"}
      </p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
        View profile →
      </span>
    </Link>
  );
}

export function RatingStars({
  rating,
  size = "sm",
  onChange,
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
  onChange?: (value: number) => void;
}) {
  const dims = { sm: "size-3.5", md: "size-4", lg: "size-6" };
  const [hover, setHover] = React.useState<number | null>(null);
  const display = hover ?? rating;
  const interactive = Boolean(onChange);

  return (
    <span
      className={cn("inline-flex items-center gap-0.5", interactive && "cursor-pointer")}
      role={interactive ? "radiogroup" : undefined}
      aria-label={`Rating: ${rating} out of 5`}
      onMouseLeave={() => setHover(null)}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = display >= i - 0.25;
        const half = !filled && display >= i - 0.75;
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            aria-label={`${i} star${i > 1 ? "s" : ""}`}
            onMouseEnter={() => interactive && setHover(i)}
            onClick={() => interactive && onChange?.(i)}
            className={cn(!interactive && "pointer-events-none")}
          >
            {half ? (
              <StarHalf className={cn(dims[size], "text-amber-400")} />
            ) : (
              <Star className={cn(dims[size], filled ? "fill-amber-400 text-amber-400" : "text-muted")} />
            )}
          </button>
        );
      })}
    </span>
  );
}
