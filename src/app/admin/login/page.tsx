"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/validations/auth";
import { BrandLogo } from "@/components/brand/BrandLogo";

// Deliberately not linked from public navigation. Access control is still
// enforced server-side in middleware.ts — this page alone is not the
// security boundary.
export default function AdminLoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    const result = await signIn("admin-credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (result?.error) {
      setServerError("Incorrect email or password.");
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-dark px-6">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 text-white backdrop-blur">
        <div className="mb-5"><BrandLogo dark subtitle="Administration" className="h-16 w-auto rounded-xl" /></div>
        <h1 className="font-display text-xl font-semibold">Admin sign in</h1>
        <p className="mt-1 text-sm text-slate-400">Restricted access — authorised administrators only.</p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-300">Admin email</span>
            <input
              {...register("email")}
              type="email"
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-cyan"
            />
            {errors.email && <span className="mt-1 block text-xs text-red-400">{errors.email.message}</span>}
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-300">Password</span>
            <input
              {...register("password")}
              type="password"
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-cyan"
            />
            {errors.password && <span className="mt-1 block text-xs text-red-400">{errors.password.message}</span>}
          </label>

          {serverError && <p className="text-sm text-red-400">{serverError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-brand-cyan px-4 py-2.5 text-sm font-semibold text-brand-dark transition hover:brightness-95 disabled:opacity-60"
          >
            {isSubmitting ? "Verifying…" : "Log in to admin"}
          </button>
        </form>
      </div>
    </main>
  );
}
