"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  EnvelopeSimpleIcon,
  LockKeyIcon,
  LockKeyOpenIcon,
  UserIcon,
  Eye,
  EyeSlash,
  Check,
  X,
} from "@phosphor-icons/react";

import { AuthCheckbox } from "@/components/ui/auth-checkbox";
import { AuthField } from "@/components/ui/auth-field";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const compactFieldClass = "h-10 rounded-md py-2 text-sm md:text-sm";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  const validateField = (name: string, value: string) => {
    switch (name) {
      case "firstName":
        if (!value.trim()) return "First name is required.";
        if (value.trim().length < 2) return "Must be at least 2 characters.";
        if (!/^[a-zA-Z\s'\-ñÑ]+$/.test(value)) return "Only letters and spaces are allowed.";
        return "";
      case "lastName":
        if (!value.trim()) return "Last name is required.";
        if (value.trim().length < 2) return "Must be at least 2 characters.";
        if (!/^[a-zA-Z\s'\-ñÑ]+$/.test(value)) return "Only letters and spaces are allowed.";
        return "";
      case "email":
        if (!value.trim()) return "Email address is required.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email address format.";
        return "";
      case "confirmPassword":
        if (!value) return "Please confirm your password.";
        if (value !== password) return "Passwords do not match.";
        return "";
      default:
        return "";
    }
  };

  async function register(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    // Touch all fields
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    const isPasswordValid = hasMinLength && hasUppercase && hasNumber && hasSpecialChar;
    const errors = {
      firstName: validateField("firstName", firstName),
      lastName: validateField("lastName", lastName),
      email: validateField("email", email),
      confirmPassword: validateField("confirmPassword", confirmPassword),
    };

    if (Object.values(errors).some((err) => err !== "") || !isPasswordValid) {
      setError("Please fix the validation errors before submitting.");
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();

    // Check if the email already exists using the public RPC
    const { data: emailExists, error: checkError } = await supabase.rpc("check_email_exists", {
      email_to_check: email,
    });

    if (checkError) {
      console.error("Error checking email existence:", checkError);
    } else if (emailExists === true) {
      setIsSubmitting(false);
      setError("An account with this email already exists");
      return;
    }

    const redirectTo = `${window.location.origin}/auth/confirm`;
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });
    setIsSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    router.push(`/auth/check-email?email=${encodeURIComponent(email)}`);
  }

  return (
    <form className="space-y-3" onSubmit={register}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <AuthField
            id="first-name"
            name="firstName"
            type="text"
            label="First Name"
            placeholder="First"
            icon={<UserIcon />}
            className={compactFieldClass}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            onBlur={() => setTouched((prev) => ({ ...prev, firstName: true }))}
            required
          />
          {touched.firstName && validateField("firstName", firstName) && (
            <p className="text-[13px] font-semibold text-[#ffb4ab] mt-1 pl-1">
              {validateField("firstName", firstName)}
            </p>
          )}
        </div>
        <div>
          <AuthField
            id="last-name"
            name="lastName"
            type="text"
            label="Last Name"
            placeholder="Last"
            icon={<UserIcon />}
            className={compactFieldClass}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            onBlur={() => setTouched((prev) => ({ ...prev, lastName: true }))}
            required
          />
          {touched.lastName && validateField("lastName", lastName) && (
            <p className="text-[13px] font-semibold text-[#ffb4ab] mt-1 pl-1">
              {validateField("lastName", lastName)}
            </p>
          )}
        </div>
      </div>

      <div>
        <AuthField
          id="email"
          name="email"
          type="email"
          label="Email Address"
          placeholder="name@example.com"
          icon={<EnvelopeSimpleIcon />}
          className={compactFieldClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
          required
        />
        {touched.email && validateField("email", email) && (
          <p className="text-[13px] font-semibold text-[#ffb4ab] mt-1 pl-1">
            {validateField("email", email)}
          </p>
        )}
      </div>



      <div>
        <AuthField
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          label="Password"
          placeholder="********"
          icon={<LockKeyIcon />}
          className={compactFieldClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
          action={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-supremo-outline hover:text-primary transition-colors focus:outline-none cursor-pointer"
            >
              {showPassword ? <EyeSlash className="size-5" /> : <Eye className="size-5" />}
            </button>
          }
          required
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

      <div>
        <AuthField
          id="confirm-password"
          name="confirmPassword"
          type={showConfirmPassword ? "text" : "password"}
          label="Confirm Password"
          placeholder="********"
          icon={<LockKeyOpenIcon />}
          className={compactFieldClass}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
          action={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-supremo-outline hover:text-primary transition-colors focus:outline-none cursor-pointer"
            >
              {showConfirmPassword ? <EyeSlash className="size-5" /> : <Eye className="size-5" />}
            </button>
          }
          required
        />
        {touched.confirmPassword && validateField("confirmPassword", confirmPassword) && (
          <p className="text-[13px] font-semibold text-[#ffb4ab] mt-1 pl-1">
            {validateField("confirmPassword", confirmPassword)}
          </p>
        )}
      </div>

      <AuthCheckbox id="terms" className="pt-1" required>
        I agree to the{" "}
        <Link href="#" className="text-primary hover:underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="#" className="text-primary hover:underline">
          Privacy Policy
        </Link>
        .
      </AuthCheckbox>

      {error ? <p className="text-sm font-semibold text-[#ffb4ab]">{error}</p> : null}

      <Button
        className="h-12 w-full rounded-lg bg-primary font-heading text-[26px] uppercase tracking-[0.18em] text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.98]"
        disabled={isSubmitting}
        type="submit"
      >
        Create Account
      </Button>
    </form>
  );
}
