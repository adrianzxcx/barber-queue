"use client";

import { useState } from "react";
import Link from "next/link";
import { EnvelopeSimpleIcon } from "@phosphor-icons/react";

import { AuthField } from "@/components/ui/auth-field";
import { Button } from "@/components/ui/button";
import { sendPasswordReset } from "./actions";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = await sendPasswordReset(email);

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Failed to send reset link.");
      return;
    }

    setIsSuccess(true);
  }

  if (isSuccess) {
    return (
      <div className="text-center">
        <div className="mb-6 rounded-lg bg-green-500/10 p-6">
          <p className="font-bold text-green-600 dark:text-green-400">
            Check your email!
          </p>
          <p className="mt-2 text-sm text-supremo-on-surface-variant">
            If an account exists for that email, we have sent password reset instructions.
          </p>
        </div>
        <Link
          href="/auth/login"
          className="inline-block font-bold text-primary hover:underline"
        >
          Back to Login
        </Link>
      </div>
    );
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
      />

      {error ? <p className="text-sm font-semibold text-red-300">{error}</p> : null}

      <Button
        className="h-16 w-full rounded-lg bg-primary font-heading text-[24px] uppercase tracking-[0.18em] text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.98]"
        disabled={isSubmitting || !email}
        type="submit"
      >
        {isSubmitting ? "Sending..." : "Send Reset Link"}
      </Button>

      <div className="text-center">
        <Link
          href="/auth/login"
          className="text-sm font-bold text-supremo-on-surface hover:text-primary hover:underline"
        >
          Back to Login
        </Link>
      </div>
    </form>
  );
}
