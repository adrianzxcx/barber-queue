"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EnvelopeSimple, CheckCircle } from "@phosphor-icons/react";

import { AuthShell } from "@/components/layout";
import { AuthPanel } from "@/components/ui/auth-panel";
import { ResendEmailButton } from "./resend-email-button";
import { createClient } from "@/lib/supabase/client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Spinner } from "@/components/ui/spinner";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Keep background polling as a fallback
  useEffect(() => {
    if (!email) return;

    const supabase = createClient();

    const checkVerificationStatus = async () => {
      const { data, error } = await supabase.rpc("check_email_verified", {
        email_to_check: email,
      });

      if (!error && data === true) {
        setIsVerified(true);
        clearInterval(intervalId);
      }
    };

    const intervalId = setInterval(checkVerificationStatus, 3000);
    checkVerificationStatus();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [email]);

  const handleVerify = async (tokenValue: string) => {
    if (tokenValue.length !== 6 || !email) return;
    setValidationError("");
    setIsValidating(true);

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: tokenValue,
      type: "signup",
    });

    setIsValidating(false);

    if (error) {
      setValidationError(error.message || "Invalid or expired verification code.");
    } else {
      setIsVerified(true);
    }
  };

  return (
    <AuthShell note="Verify your identity.">
      <AuthPanel className="mx-auto w-full max-w-[540px] text-center">
        {isVerified ? (
          <div className="w-full flex flex-col items-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle className="h-10 w-10 text-emerald-400" weight="fill" />
            </div>
            
            <h2 className="mb-4 font-heading text-[34px] uppercase leading-none text-supremo-on-surface">
              Email Confirmed Successfully
            </h2>
            
            <p className="mb-8 text-supremo-on-surface-variant">
              Your email has been verified. You may now proceed to your dashboard.
            </p>

            <div className="flex flex-col items-center gap-4 w-full">
              <a
                href="/user/dashboard"
                className="w-full flex justify-center items-center h-12 bg-primary text-primary-foreground font-heading text-lg uppercase tracking-wider hover:bg-[#c89b3c] active:scale-[0.98] transition-all rounded-none"
              >
                PROCEED
              </a>
            </div>
          </div>
        ) : email ? (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <EnvelopeSimple className="h-8 w-8 text-primary" weight="regular" />
            </div>
            
            <h2 className="mb-4 font-heading text-[34px] uppercase leading-none text-supremo-on-surface">
              Verify Your Account
            </h2>
            
            <p className="mb-2 text-supremo-on-surface-variant">
              We&apos;ve sent a 6-digit confirmation code to:
            </p>
            <p className="mb-6 font-bold text-supremo-on-surface">
              {email}
            </p>
            
            <p className="mb-6 text-sm text-supremo-on-surface-variant/80">
              Enter the code below to confirm your account and complete your registration.
            </p>

            {/* OTP Input component */}
            <div className="flex flex-col items-center justify-center gap-4 mb-6">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value) => {
                  setOtp(value);
                  if (value.length === 6) {
                    handleVerify(value);
                  }
                }}
                disabled={isValidating}
                autoFocus
              >
                <InputOTPGroup className="gap-2">
                  <InputOTPSlot index={0} className="w-12 h-14 text-2xl border border-border bg-[#1c1811] text-primary focus:border-primary focus:ring-1 focus:ring-primary rounded-none font-mono font-bold" />
                  <InputOTPSlot index={1} className="w-12 h-14 text-2xl border border-border bg-[#1c1811] text-primary focus:border-primary focus:ring-1 focus:ring-primary rounded-none font-mono font-bold" />
                  <InputOTPSlot index={2} className="w-12 h-14 text-2xl border border-border bg-[#1c1811] text-primary focus:border-primary focus:ring-1 focus:ring-primary rounded-none font-mono font-bold" />
                  <InputOTPSlot index={3} className="w-12 h-14 text-2xl border border-border bg-[#1c1811] text-primary focus:border-primary focus:ring-1 focus:ring-primary rounded-none font-mono font-bold" />
                  <InputOTPSlot index={4} className="w-12 h-14 text-2xl border border-border bg-[#1c1811] text-primary focus:border-primary focus:ring-1 focus:ring-primary rounded-none font-mono font-bold" />
                  <InputOTPSlot index={5} className="w-12 h-14 text-2xl border border-border bg-[#1c1811] text-primary focus:border-primary focus:ring-1 focus:ring-primary rounded-none font-mono font-bold" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {isValidating && (
              <div className="flex items-center justify-center gap-2 mb-4 text-primary text-sm font-semibold">
                <Spinner className="h-4 w-4 animate-spin" />
                <span>Verifying code...</span>
              </div>
            )}

            {validationError && (
              <p className="text-sm font-semibold text-red-400 mb-4 bg-red-950/20 border border-red-900/30 py-2 px-3">
                {validationError}
              </p>
            )}

            <div className="flex flex-col items-center gap-4 w-full mt-4">
              <button
                type="button"
                onClick={() => handleVerify(otp)}
                disabled={otp.length !== 6 || isValidating}
                className="w-full flex justify-center items-center h-12 bg-primary text-primary-foreground font-heading text-lg uppercase tracking-wider hover:bg-[#c89b3c] active:scale-[0.98] transition-all rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isValidating ? "Verifying..." : "Verify Code"}
              </button>
              
              <ResendEmailButton email={email} />
              
              <Link
                href="/auth/login"
                className="mt-4 text-sm font-bold text-primary hover:underline"
              >
                Back to Login
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <EnvelopeSimple className="h-8 w-8 text-primary" weight="regular" />
            </div>
            
            <h2 className="mb-4 font-heading text-[34px] uppercase leading-none text-supremo-on-surface">
              Verify Email
            </h2>
            
            <p className="mb-6 text-supremo-on-surface-variant">
              Please enter your email to proceed with verification:
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const enteredEmail = String(formData.get("email") || "").trim();
                if (enteredEmail) {
                  setEmail(enteredEmail);
                }
              }}
              className="space-y-4 w-full"
            >
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="name@example.com"
                  className="w-full h-12 px-4 bg-[#1c1811] border border-border text-supremo-on-surface placeholder-supremo-on-surface-variant/50 focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              
              <button
                type="submit"
                className="w-full flex justify-center items-center h-12 bg-primary text-primary-foreground font-heading text-lg uppercase tracking-wider hover:bg-[#c89b3c] active:scale-[0.98] transition-all rounded-none"
              >
                Continue
              </button>
            </form>

            <div className="flex justify-center mt-6">
              <Link
                href="/auth/login"
                className="text-sm font-bold text-primary hover:underline"
              >
                Back to Login
              </Link>
            </div>
          </>
        )}
      </AuthPanel>
    </AuthShell>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#17130c]" />}>
      <CheckEmailContent />
    </Suspense>
  );
}

