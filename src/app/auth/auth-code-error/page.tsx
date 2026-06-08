import Link from "next/link";
import { WarningCircle } from "@phosphor-icons/react/dist/ssr";

import { AuthShell } from "@/components/layout";
import { AuthPanel } from "@/components/ui/auth-panel";

export default function AuthCodeErrorPage() {
  return (
    <AuthShell note="Secure access starts here.">
      <AuthPanel className="mx-auto w-full max-w-[540px] text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <WarningCircle className="h-8 w-8 text-red-600 dark:text-red-500" weight="fill" />
        </div>
        
        <h2 className="mb-4 font-heading text-2xl uppercase leading-none text-supremo-on-surface">
          Invalid or Expired Link
        </h2>
        
        <p className="mb-8 text-supremo-on-surface-variant">
          The confirmation link you followed has expired or is invalid. Please request a new link to continue.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/auth/login"
            className="inline-flex h-12 items-center justify-center rounded bg-primary px-8 font-heading text-sm font-bold uppercase tracking-wider text-supremo-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Back to Login
          </Link>
        </div>
      </AuthPanel>
    </AuthShell>
  );
}
