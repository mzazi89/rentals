"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Home, KeyRound, UserCheck } from "lucide-react";
import { Button, Field, Input } from "@/components/ui/core";
import { useToast } from "@/components/ui/feedback";
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  roleSelectSchema,
} from "@/lib/validations";
import { chooseRoleAction, createProfileAfterSignup } from "@/app/actions/auth";
import { authClient } from "@/lib/auth-client";
import type { z } from "zod";

/* ------------------------------------------------------------------ */
/* Login (client SDK — sets the session cookie properly)              */
/* ------------------------------------------------------------------ */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    const { error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    });
    if (error) {
      const message = error.message ?? "Login failed.";
      toast(/verify/i.test(message) ? "Please verify your email address first." : message, "error");
      return;
    }
    toast("Signed in successfully", "success");
    const next = searchParams.get("next");
    router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field label="Email" required error={errors.email?.message}>
        <Input type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />
      </Field>
      <Field label="Password" required error={errors.password?.message}>
        <Input type="password" autoComplete="current-password" {...register("password")} />
      </Field>
      <Button type="submit" className="w-full">Sign in</Button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Signup (client SDK — establishes the session for role selection)   */
/* ------------------------------------------------------------------ */
export function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof signupSchema>>({ resolver: zodResolver(signupSchema) });

  const onSubmit = async (values: z.infer<typeof signupSchema>) => {
    const { error } = await authClient.signUp.email({
      email: values.email,
      password: values.password,
      name: values.fullName,
      callbackURL: "/signup/role",
    });
    if (error) {
      toast(error.message ?? "Signup failed.", "error");
      return;
    }
    // Create the app profile row from the now-established session.
    const result = await createProfileAfterSignup();
    if (!result.ok) {
      toast(result.error ?? "Could not finish account setup.", "error");
      return;
    }
    toast("Account created. Choose your role to continue.", "success");
    router.push("/signup/role");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field label="Full name" required error={errors.fullName?.message}>
        <Input autoComplete="name" placeholder="Jane Wanjiku" {...register("fullName")} />
      </Field>
      <Field label="Email" required error={errors.email?.message}>
        <Input type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />
      </Field>
      <Field label="Password" required hint="At least 8 characters" error={errors.password?.message}>
        <Input type="password" autoComplete="new-password" {...register("password")} />
      </Field>
      <Button type="submit" className="w-full">Create account</Button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Role selection                                                     */
/* ------------------------------------------------------------------ */
export function RoleSelectForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [role, setRole] = React.useState<"tenant" | "agent" | "landlord" | null>(null);
  const [loading, setLoading] = React.useState(false);

  const options = [
    { value: "tenant", label: "Tenant", desc: "Search properties, book viewings and apply.", icon: Home },
    { value: "agent", label: "Rent Agent", desc: "List properties, manage viewings and earn commission.", icon: UserCheck },
    { value: "landlord", label: "Landlord", desc: "List your property, assign agents and track income.", icon: Building2 },
  ] as const;

  const submit = async () => {
    if (!role) return;
    setLoading(true);
    const parsed = roleSelectSchema.safeParse({ role });
    if (!parsed.success) {
      toast(parsed.error.issues[0]?.message ?? "Choose a role", "error");
      setLoading(false);
      return;
    }
    try {
      const result = await chooseRoleAction(parsed.data);
      if (result.ok) {
        router.push(`/signup/onboarding/${result.role}`);
        router.refresh();
      } else {
        toast(result.error ?? "Could not set role.", "error");
      }
    } catch {
      toast("Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => setRole(o.value)}
          aria-pressed={role === o.value}
          className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-colors ${
            role === o.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"
          }`}
        >
          <o.icon className="mt-0.5 size-5 text-primary" />
          <span>
            <span className="block font-medium">{o.label}</span>
            <span className="block text-sm text-muted-foreground">{o.desc}</span>
          </span>
        </button>
      ))}
      <Button onClick={submit} disabled={!role} loading={loading} className="w-full">
        <KeyRound className="size-4" /> Continue as {role ? options.find((o) => o.value === role)?.label : "…"}
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Forgot / reset password                                            */
/* ------------------------------------------------------------------ */
export function ForgotPasswordForm() {
  const { toast } = useToast();
  const [done, setDone] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof forgotPasswordSchema>>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (values: z.infer<typeof forgotPasswordSchema>) => {
    const { error } = await authClient.requestPasswordReset({
      email: values.email,
      redirectTo: "/reset-password",
    });
    if (error) {
      toast(error.message ?? "Something went wrong.", "error");
      return;
    }
    setDone(true);
    toast("Password reset link sent", "success");
  };

  if (done) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        If an account exists for that email, a password reset link has been sent. Check your inbox.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field label="Email" required error={errors.email?.message}>
        <Input type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />
      </Field>
      <Button type="submit" className="w-full">Send reset link</Button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof resetPasswordSchema>>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (values: z.infer<typeof resetPasswordSchema>) => {
    if (!token) {
      toast("The reset link is invalid or expired. Request a new one.", "error");
      return;
    }
    try {
      await authClient.resetPassword({ newPassword: values.password, token });
      toast("Password updated. Please sign in.", "success");
      router.push("/login");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not update password.", "error");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field label="New password" required error={errors.password?.message}>
        <Input type="password" autoComplete="new-password" {...register("password")} />
      </Field>
      <Field label="Confirm new password" required error={errors.confirmPassword?.message}>
        <Input type="password" autoComplete="new-password" {...register("confirmPassword")} />
      </Field>
      <Button type="submit" className="w-full">Update password</Button>
    </form>
  );
}
