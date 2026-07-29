"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/validations/auth";
import { BrandLogo } from "@/components/brand/BrandLogo";

const ERROR_MESSAGES: Record<string, string> = {
  ACCOUNT_LOCKED: "Too many failed attempts. Your account is temporarily locked — try again shortly.",
  ACCOUNT_DISABLED: "This account has been suspended. Contact support for help.",
  EMAIL_NOT_VERIFIED: "Please verify your email address before logging in.",
  CredentialsSignin: "Incorrect email or password.",
};

export default function LoginPage() {
  return <Suspense fallback={<main className="flex min-h-screen items-center justify-center">Loading…</main>}><LoginForm /></Suspense>;
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/dashboard";
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (result?.error) {
      setServerError(ERROR_MESSAGES[result.error] ?? "Unable to log in. Please try again.");
      return;
    }

    router.push(next);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 font-display text-lg font-semibold">
          <BrandLogo className="h-14 w-auto rounded-xl" />
        </Link>
        <h1 className="font-display text-2xl font-semibold text-slate-900">Log in</h1>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Email address</span>
            <input {...register("email")} type="email" className="input" autoComplete="email" />
            {errors.email && <span className="mt-1 block text-xs text-brand-error">{errors.email.message}</span>}
          </label>
          <label className="block">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <Link href="/forgot-password" className="text-xs font-medium text-brand-indigo">Forgot password?</Link>
            </div>
            <input {...register("password")} type="password" className="input" autoComplete="current-password" />
            {errors.password && <span className="mt-1 block text-xs text-brand-error">{errors.password.message}</span>}
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" {...register("rememberMe")} />
            Remember me
          </label>

          {serverError && <p className="text-sm text-brand-error">{serverError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-brand-indigo px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {isSubmitting ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-brand-indigo">Sign up free</Link>
        </p>
        <p className="mt-4 text-center">
          <Link href="/" className="text-sm font-medium text-slate-600 hover:text-brand-indigo">
            ← Back to homepage
          </Link>
        </p>
      </div>
    </main>
  );
}
