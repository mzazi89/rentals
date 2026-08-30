"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button, Field, Input, Select } from "@/components/ui/core";
import { useToast } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";
import {
  addFloor,
  addUnit,
  deleteFloor,
  deleteUnit,
  renameFloor,
  renameUnit,
  updateUnitStatus,
} from "@/app/actions/units";
import type { BuildingFloor, BuildingUnit } from "@/types";

const STATUS_LABELS: Record<string, string> = {
  available: "Available",
  reserved: "Reserved",
  occupied: "Taken",
  inactive: "Inactive",
};

const STATUS_STYLES: Record<string, string> = {
  available: "border-green-500/40 bg-green-500/10 text-green-200",
  reserved: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  occupied: "border-red-500/40 bg-red-500/10 text-red-200",
  inactive: "border-gray-500/40 bg-gray-500/10 text-gray-300",
};

export function UnitManager({
  propertyId,
  mode,
  floors,
}: {
  propertyId: string;
  mode: "manage" | "mark";
  floors: (BuildingFloor & { units: BuildingUnit[] })[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [newFloor, setNewFloor] = React.useState("");
  const [newUnit, setNewUnit] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState<string | null>(null);

  const run = async (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string, key: string) => {
    setBusy(key);
    const result = await fn();
    if (result.ok) {
      toast(msg, "success");
      router.refresh();
    } else {
      toast(result.error ?? "Action failed.", "error");
    }
    setBusy(null);
  };

  const promptRename = (floor: BuildingFloor) => {
    const name = window.prompt("Floor name", floor.name);
    if (name && name.trim() && name.trim() !== floor.name) {
      void run(() => renameFloor(floor.id, name.trim()), "Floor renamed", `rf-${floor.id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Floors + units */}
      {floors.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No floors yet. Add the first floor and its units below to structure this building.
        </p>
      ) : (
        <div className="space-y-4">
          {floors.map((floor) => (
            <div key={floor.id} className="overflow-hidden rounded-xl border bg-card">
              <div className="flex items-center justify-between gap-2 border-b bg-muted/30 px-4 py-2.5">
                <h3 className="text-sm font-semibold">{floor.name}</h3>
                {mode === "manage" ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => promptRename(floor)}
                      className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      Rename
                    </button>
                    <button
                      aria-label={`Delete floor ${floor.name}`}
                      onClick={() =>
                        void run(() => deleteFloor(floor.id), "Floor removed", `df-${floor.id}`)
                      }
                      className="rounded-md p-1 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2 p-4">
                {floor.units.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No units on this floor yet.</p>
                ) : (
                  floor.units.map((unit) => (
                    <div
                      key={unit.id}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium",
                        STATUS_STYLES[unit.status]
                      )}
                    >
                      <span>{unit.unit_number}</span>
                      <select
                        aria-label={`Status of unit ${unit.unit_number}`}
                        value={unit.status}
                        onChange={(e) =>
                          void run(
                            () => updateUnitStatus(unit.id, e.target.value),
                            `${unit.unit_number} marked ${e.target.value}`,
                            `st-${unit.id}`
                          )
                        }
                        className="rounded-md border border-black/10 bg-transparent px-1 py-0.5 text-xs font-medium focus-visible:outline-none"
                      >
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      {mode === "manage" ? (
                        <button
                          aria-label={`Delete unit ${unit.unit_number}`}
                          onClick={() =>
                            void run(() => deleteUnit(unit.id), "Unit removed", `du-${unit.id}`)
                          }
                          className="text-red-700/70 hover:text-red-700"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      ) : null}
                    </div>
                  ))
                )}
              </div>

              {mode === "manage" ? (
                <div className="flex items-center gap-2 border-t px-4 py-3">
                  <Input
                    value={newUnit[floor.id] ?? ""}
                    onChange={(e) =>
                      setNewUnit((prev) => ({ ...prev, [floor.id]: e.target.value }))
                    }
                    placeholder={`Unit number (e.g. ${floor.name === "Ground" ? "G1" : "B1"})`}
                    className="h-9 max-w-44"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const number = (newUnit[floor.id] ?? "").trim();
                        if (!number) return;
                        void run(
                          () =>
                            addUnit({
                              propertyId,
                              floorId: floor.id === "no-floor" ? null : floor.id,
                              unitNumber: number,
                            }),
                          "Unit added",
                          `au-${floor.id}`
                        );
                        setNewUnit((prev) => ({ ...prev, [floor.id]: "" }));
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const number = (newUnit[floor.id] ?? "").trim();
                      if (!number) return;
                      void run(
                        () =>
                          addUnit({
                            propertyId,
                            floorId: floor.id === "no-floor" ? null : floor.id,
                            unitNumber: number,
                          }),
                        "Unit added",
                        `au-${floor.id}`
                      );
                      setNewUnit((prev) => ({ ...prev, [floor.id]: "" }));
                    }}
                  >
                    <Plus className="size-3.5" /> Add unit
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* Add floor (landlord only) */}
      {mode === "manage" ? (
        <div className="flex items-end gap-2 rounded-xl border border-dashed p-4">
          <div className="flex-1">
            <Field label="Add a floor">
              <Input
                value={newFloor}
                onChange={(e) => setNewFloor(e.target.value)}
                placeholder="e.g. Floor 1 / Ground / Basement"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const name = newFloor.trim();
                    if (!name) return;
                    void run(() => addFloor(propertyId, name), "Floor added", "af");
                    setNewFloor("");
                  }
                }}
              />
            </Field>
          </div>
          <Button
            onClick={() => {
              const name = newFloor.trim();
              if (!name) return;
              void run(() => addFloor(propertyId, name), "Floor added", "af");
              setNewFloor("");
            }}
          >
            <Plus className="size-4" /> Add floor
          </Button>
        </div>
      ) : null}

      {mode === "mark" ? (
        <p className="text-sm text-muted-foreground">
          Select a status for each unit. The building structure (floors & numbers) is set by the
          landlord — here you mark which units are taken, reserved or available.
        </p>
      ) : null}
    </div>
  );
}
