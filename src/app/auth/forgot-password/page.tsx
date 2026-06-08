import { AuthShell } from "@/components/layout";
import { AuthPanel } from "@/components/ui/auth-panel";
import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell note="Secure your account.">
      <AuthPanel className="mx-auto w-full max-w-[540px]">
        <div className="mb-9">
          <h2 className="font-heading text-[34px] uppercase leading-none text-supremo-on-surface">
            Reset Password
          </h2>
          <div className="mt-3 h-0.5 w-14 bg-primary" />
          <p className="mt-4 text-sm text-supremo-on-surface-variant">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        <ForgotPasswordForm />
      </AuthPanel>
    </AuthShell>
  );
}
