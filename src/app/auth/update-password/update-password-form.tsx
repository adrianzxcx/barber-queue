"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyIcon, EyeIcon, Check, X } from "@phosphor-icons/react";
import { toast } from "sonner";

import { AuthField } from "@/components/ui/auth-field";
import { Button } from "@/components/ui/button";
import { updatePassword } from "./actions";

export function UpdatePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const isPasswordValid = hasMinLength && hasUppercase && hasNumber && hasSpecialChar;
    if (!isPasswordValid) {
      setError("Please satisfy all password requirements.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const result = await updatePassword(password);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Failed to update password.");
      return;
    }

    toast.success("Password updated successfully! Please login with your new password.");
    router.push("/auth/login");
  }

  return (
    <form className="space-y-7" onSubmit={onSubmit}>
      <div>
        <AuthField
          id="password"
          type={showPassword ? "text" : "password"}
          label="New Password"
          placeholder="********"
          icon={<LockKeyIcon />}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
          action={
            <button
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-4 top-1/2 flex -translate-y-1/2 text-supremo-on-surface-variant transition-colors hover:text-primary [&_svg]:size-6"
              onClick={() => setShowPassword((current) => !current)}
              type="button"
            >
              <EyeIcon />
            </button>
          }
        />

        {/* Password Requirements Checklist */}
        <div className="space-y-1.5 mt-2 px-1 text-left">
          <div className="flex items-center gap-2 text-[13px] leading-tight">
            {hasMinLength ? (
              <Check className="h-4 w-4 text-emerald-400 shrink-0" weight="bold" />
            ) : (
              <X className="h-4 w-4 text-supremo-on-surface-variant/40 shrink-0" weight="bold" />
            )}
            <span className={hasMinLength ? "text-emerald-400 font-medium" : "text-supremo-on-surface-variant/60"}>
              Minimum 8 characters
            </span>
          </div>

          <div className="flex items-center gap-2 text-[13px] leading-tight">
            {hasUppercase ? (
              <Check className="h-4 w-4 text-emerald-400 shrink-0" weight="bold" />
            ) : (
              <X className="h-4 w-4 text-supremo-on-surface-variant/40 shrink-0" weight="bold" />
            )}
            <span className={hasUppercase ? "text-emerald-400 font-medium" : "text-supremo-on-surface-variant/60"}>
              At least one uppercase letter
            </span>
          </div>

          <div className="flex items-center gap-2 text-[13px] leading-tight">
            {hasNumber ? (
              <Check className="h-4 w-4 text-emerald-400 shrink-0" weight="bold" />
            ) : (
              <X className="h-4 w-4 text-supremo-on-surface-variant/40 shrink-0" weight="bold" />
            )}
            <span className={hasNumber ? "text-emerald-400 font-medium" : "text-supremo-on-surface-variant/60"}>
              At least one number
            </span>
          </div>

          <div className="flex items-center gap-2 text-[13px] leading-tight">
            {hasSpecialChar ? (
              <Check className="h-4 w-4 text-emerald-400 shrink-0" weight="bold" />
            ) : (
              <X className="h-4 w-4 text-supremo-on-surface-variant/40 shrink-0" weight="bold" />
            )}
            <span className={hasSpecialChar ? "text-emerald-400 font-medium" : "text-supremo-on-surface-variant/60"}>
              At least one special character
            </span>
          </div>
        </div>
      </div>

      <AuthField
        id="confirmPassword"
        type={showPassword ? "text" : "password"}
        label="Confirm New Password"
        placeholder="********"
        icon={<LockKeyIcon />}
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        required
        minLength={8}
      />

      {error ? <p className="text-sm font-semibold text-red-300">{error}</p> : null}

      <Button
        className="h-16 w-full rounded-lg bg-primary font-heading text-[24px] uppercase tracking-[0.18em] text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.98]"
        disabled={isSubmitting || !password || !confirmPassword}
        type="submit"
      >
        {isSubmitting ? "Updating..." : "Update Password"}
      </Button>
    </form>
  );
}
