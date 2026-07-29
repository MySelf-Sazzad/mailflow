"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/validations/auth";
import { BrandLogo } from "@/components/brand/BrandLogo";

export default function RegisterPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [autoVerified, setAutoVerified] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (res.ok) {
      const data = await res.json();
      setVerificationUrl(data.verificationUrl ?? null);
      setAutoVerified(Boolean(data.autoVerified));
      setSubmitted(true);
      return;
    }

    const data = await res.json().catch(() => null);
    setServerError(data?.error ?? "Something went wrong. Please try again.");
  }

  if (submitted && autoVerified) {
    return (
      <AuthShell title="Account created">
        <p className="text-sm text-slate-600">
          Your account is active. You can log in now using the email address and password you just created.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-brand-indigo">
          Continue to log in
        </Link>
      </AuthShell>
    );
  }

  if (submitted) {
    return (
      <AuthShell title="Check your inbox">
        <p className="text-sm text-slate-600">
          We&apos;ve sent a verification link to your email address. Confirm it to activate your
          account — you won&apos;t be able to send campaigns until it&apos;s verified.
        </p>
        {verificationUrl && <div className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm"><p className="font-semibold text-indigo-900">Local development mode</p><p className="mt-1 text-indigo-700">No real email was sent. Use this local verification link:</p><a href={verificationUrl} className="mt-3 inline-block font-semibold text-brand-indigo underline">Verify my account</a></div>}
        <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-brand-indigo">
          Back to log in
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create your account" subtitle="Start free — no credit card required.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Field label="Full name" error={errors.fullName?.message}>
          <input {...register("fullName")} className="input" autoComplete="name" />
        </Field>
        <Field label="Email address" error={errors.email?.message}>
          <input {...register("email")} type="email" className="input" autoComplete="email" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Company name" error={errors.companyName?.message}>
            <input {...register("companyName")} className="input" />
          </Field>
          <Field label="Country" error={errors.country?.message}>
            <input {...register("country")} className="input" />
          </Field>
        </div>
        <Field label="Password" error={errors.password?.message}>
          <input {...register("password")} type="password" className="input" autoComplete="new-password" />
        </Field>
        <Field label="Confirm password" error={errors.confirmPassword?.message}>
          <input {...register("confirmPassword")} type="password" className="input" autoComplete="new-password" />
        </Field>

        <label className="flex items-start gap-2 text-sm text-slate-600">
          <input type="checkbox" {...register("acceptedTerms")} className="mt-0.5" />
          <span>
            I agree to the <Link href="/legal/terms" className="text-brand-indigo">Terms and Conditions</Link> and{" "}
            <Link href="/legal/privacy" className="text-brand-indigo">Privacy Policy</Link>.
          </span>
        </label>
        {errors.acceptedTerms && <p className="text-xs text-brand-error">{errors.acceptedTerms.message}</p>}

        {serverError && <p className="text-sm text-brand-error">{serverError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-brand-indigo px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-indigo">Log in</Link>
      </p>
    </AuthShell>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-brand-error">{error}</span>}
    </label>
  );
}

function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 font-display text-lg font-semibold">
          <BrandLogo className="h-14 w-auto rounded-xl" />
        </Link>
        <h1 className="font-display text-2xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
