"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  EnvelopeSimpleIcon,
  EyeIcon,
  LockKeyIcon,
  LockSimpleIcon,
} from "@phosphor-icons/react";

import Link from "next/link";
import { AuthField } from "@/components/ui/auth-field";
import { Button } from "@/components/ui/button";
import { login } from "./actions";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsRateLimited(false);
    setIsSubmitting(true);

    const result = await login({ email, password });

    setIsSubmitting(false);

    if (!result.success) {
      if (result.error === "email_not_confirmed") {
        router.push(
          `/auth/check-email?email=${encodeURIComponent(result.email || email)}`
        );
        return;
      }

      if ("rateLimited" in result && result.rateLimited) {
        setIsRateLimited(true);
      }

      setError(result.error || "Login failed.");
      return;
    }

    if (result.redirectTo) {
      router.replace(result.redirectTo);
      router.refresh();
    }
  }

  return (
    <form className="space-y-7" onSubmit={onSubmit}>
      <AuthField
        id="email"
        type="email"
        label="Email Address"
        placeholder="Enter your email"
        icon={<EnvelopeSimpleIcon />}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
        disabled={isRateLimited}
      />

      <AuthField
        id="password"
        type={showPassword ? "text" : "password"}
        label="Password"
        placeholder="********"
        icon={<LockKeyIcon />}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
        disabled={isRateLimited}
        action={
          <button
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-4 top-1/2 flex -translate-y-1/2 text-supremo-on-surface-variant transition-colors hover:text-primary [&_svg]:size-6"
            onClick={() => setShowPassword((current) => !current)}
            type="button"
            suppressHydrationWarning={true}
          >
            <EyeIcon />
          </button>
        }
      />

      <div className="flex justify-end">
        <Link
          href="/auth/forgot-password"
          className="text-sm font-semibold text-primary hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      {/* Error / Rate-limit feedback */}
      {error ? (
        <div
          className={`flex items-start gap-3 rounded-md border px-4 py-3 text-sm font-semibold ${
            isRateLimited
              ? "border-red-800/50 bg-red-950/30 text-red-400"
              : "border-red-900/30 bg-transparent text-red-300"
          }`}
        >
          {isRateLimited && (
            <LockSimpleIcon className="mt-0.5 size-4 shrink-0" weight="fill" />
          )}
          <span>{error}</span>
        </div>
      ) : null}

      <Button
        className="h-16 w-full rounded-lg bg-primary font-heading text-[30px] uppercase tracking-[0.18em] text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isSubmitting || isRateLimited}
        type="submit"
      >
        {isSubmitting ? "Logging In…" : isRateLimited ? "Locked Out" : "Login"}
      </Button>
    </form>
  );
}
