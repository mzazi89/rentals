"use client";

import * as React from "react";
import { X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Dialog (modal)                                                     */
/* ------------------------------------------------------------------ */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const sizes = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={() => onOpenChange(false)} />
      <div className={cn("relative z-10 w-full animate-slide-in rounded-t-xl bg-card shadow-lift sm:rounded-xl", sizes[size])}>
        <div className="flex items-start justify-between border-b p-4 sm:p-5">
          <div>
            {title ? <h2 className="text-lg font-semibold">{title}</h2> : null}
            {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          <button
            aria-label="Close dialog"
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-5">{children}</div>
        {footer ? <div className="flex justify-end gap-2 border-t p-4">{footer}</div> : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ConfirmDialog (destructive actions)                                */
/* ------------------------------------------------------------------ */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  variant = "destructive",
  loading,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "destructive" | "default";
  loading?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-10 rounded-md border border-input px-4 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={cn(
              "h-10 rounded-md px-4 text-sm font-medium text-white",
              variant === "destructive" ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90",
              loading && "opacity-60"
            )}
          >
            {loading ? "Please wait…" : confirmLabel}
          </button>
        </>
      }
    />
  );
}

/* ------------------------------------------------------------------ */
/* DropdownMenu                                                       */
/* ------------------------------------------------------------------ */
export function DropdownMenu({
  trigger,
  children,
  align = "end",
  className,
}: {
  trigger: React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: "start" | "end";
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="inline-flex items-center">
        {trigger}
      </button>
      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute z-50 mt-1 min-w-[180px] animate-fade-in rounded-lg border bg-popover p-1 shadow-lift",
            align === "end" ? "right-0" : "left-0",
            className
          )}
        >
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  );
}

export function DropdownItem({
  onClick,
  children,
  destructive,
  className,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  destructive?: boolean;
  className?: string;
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted",
        destructive ? "text-destructive" : "text-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}

export function DropdownLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{children}</div>;
}

/* ------------------------------------------------------------------ */
/* Sheet (mobile drawer)                                              */
/* ------------------------------------------------------------------ */
export function Sheet({
  open,
  onOpenChange,
  title,
  children,
  side = "right",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
  side?: "left" | "right" | "bottom";
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const position =
    side === "right"
      ? "inset-y-0 right-0 h-full max-w-md w-full"
      : side === "left"
        ? "inset-y-0 left-0 h-full max-w-md w-full"
        : "inset-x-0 bottom-0 max-h-[85vh] w-full rounded-t-2xl";

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={() => onOpenChange(false)} />
      <div className={cn("absolute animate-slide-in bg-card shadow-lift", position)}>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-base font-semibold">{title}</h2>
          <button aria-label="Close panel" onClick={() => onOpenChange(false)} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
            <X className="size-5" />
          </button>
        </div>
        <div className="max-h-[calc(100%-3.5rem)] overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

/* Chevron helper for selects styled as buttons */
export function SelectChevron({ className }: { className?: string }) {
  return <ChevronDown className={cn("pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground", className)} />;
}
