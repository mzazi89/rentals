"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Badge                                                              */
/* ------------------------------------------------------------------ */
const badgeVariants = {
  default: "bg-primary/10 text-primary",
  secondary: "bg-secondary text-secondary-foreground",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  outline: "border border-input text-foreground",
} as const;

export function Badge({
  variant = "default",
  className,
  children,
}: {
  variant?: keyof typeof badgeVariants;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        badgeVariants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

/** Status badge with automatic color mapping from a status string. */
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const map: Record<string, keyof typeof badgeVariants> = {
    active: "success",
    verified: "success",
    approved: "success",
    available: "success",
    paid: "success",
    completed: "success",
    successful: "success",
    resolved: "success",
    pending: "warning",
    under_review: "warning",
    pending_review: "warning",
    reserved: "warning",
    partially_paid: "warning",
    info_requested: "warning",
    overdue: "destructive",
    rejected: "destructive",
    cancelled: "destructive",
    terminated: "destructive",
    failed: "destructive",
    no_show: "destructive",
    suspended: "destructive",
    hidden: "destructive",
    dismissed: "secondary",
    draft: "secondary",
    inactive: "secondary",
    occupied: "secondary",
    withdrawn: "secondary",
    expired: "secondary",
    refunded: "secondary",
    open: "warning",
    investigating: "warning",
    pending_approval: "warning",
    submitted: "default",
    rescheduled: "default",
  };
  return (
    <Badge variant={map[status] ?? "default"} className={className}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

/* ------------------------------------------------------------------ */
/* Alert                                                              */
/* ------------------------------------------------------------------ */
export function Alert({
  variant = "info",
  title,
  children,
  className,
}: {
  variant?: "info" | "success" | "warning" | "error";
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const styles = {
    info: "border-blue-500/40 bg-blue-500/10 text-blue-100",
    success: "border-green-500/40 bg-green-500/10 text-green-100",
    warning: "border-amber-500/40 bg-amber-500/10 text-amber-100",
    error: "border-red-500/40 bg-red-500/10 text-red-100",
  }[variant];
  const Icon = variant === "error" ? AlertCircle : variant === "success" ? CheckCircle2 : Info;
  return (
    <div role={variant === "error" ? "alert" : undefined} className={cn("flex gap-3 rounded-lg border p-4 text-sm", styles, className)}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div>
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? <div className={title ? "mt-1" : undefined}>{children}</div> : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton / Spinner                                                 */
/* ------------------------------------------------------------------ */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md", className)} />;
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block size-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary",
        className
      )}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                        */
/* ------------------------------------------------------------------ */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center", className)}>
      {icon ? <div className="mb-3 text-muted-foreground">{icon}</div> : null}
      <h3 className="text-base font-semibold">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Toasts                                                             */
/* ------------------------------------------------------------------ */
type ToastVariant = "success" | "error" | "info";
interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
}

const ToastContext = React.createContext<{
  toast: (message: string, variant?: ToastVariant) => void;
}>({ toast: () => {} });

export function useToast() {
  return React.useContext(ToastContext);
}

export function Toaster() {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const idRef = React.useRef(0);

  const toast = React.useCallback((message: string, variant: ToastVariant = "info") => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, variant, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {toasts.length > 0 ? (
        <div aria-live="polite" className="print-hidden fixed bottom-4 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={cn(
                "animate-slide-in flex items-start gap-2 rounded-lg border bg-popover p-3 text-sm shadow-lift",
                t.variant === "success" && "border-green-500/40 text-green-200",
                t.variant === "error" && "border-red-500/40 text-red-200",
                t.variant === "info" && "border-border text-foreground"
              )}
            >
              {t.variant === "success" ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : null}
              {t.variant === "error" ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : null}
              <span className="flex-1">{t.message}</span>
              <button
                aria-label="Dismiss notification"
                className="opacity-60 hover:opacity-100"
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}
