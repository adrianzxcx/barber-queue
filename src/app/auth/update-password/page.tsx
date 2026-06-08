import { AuthShell } from "@/components/layout";
import { AuthPanel } from "@/components/ui/auth-panel";
import { UpdatePasswordForm } from "./update-password-form";

export default function UpdatePasswordPage() {
  return (
    <AuthShell note="Secure your account.">
      <AuthPanel className="mx-auto w-full max-w-[540px]">
        <div className="mb-9">
          <h2 className="font-heading text-[34px] uppercase leading-none text-supremo-on-surface">
            Set New Password
          </h2>
          <div className="mt-3 h-0.5 w-14 bg-primary" />
          <p className="mt-4 text-sm text-supremo-on-surface-variant">
            Please enter your new password below.
          </p>
        </div>

        <UpdatePasswordForm />
      </AuthPanel>
    </AuthShell>
  );
}
