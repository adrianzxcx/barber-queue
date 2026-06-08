import Link from "next/link";

import { AuthShell } from "@/components/layout";
import { AuthPanel } from "@/components/ui/auth-panel";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <AuthShell note="Precision is not an act, it's a habit.">
      <AuthPanel className="mx-auto w-full max-w-[540px]">
        <div className="mb-9 text-center lg:hidden">
          <h1 className="font-heading text-[46px] uppercase leading-none text-primary">
            Supremo Lounge
          </h1>
          <p className="mt-2 text-sm font-bold uppercase leading-5 tracking-widest text-supremo-on-surface-variant">
            Member Portal
          </p>
        </div>

        <div className="mb-9">
          <h2 className="font-heading text-[34px] uppercase leading-none text-supremo-on-surface">
            Member Login
          </h2>
          <div className="mt-3 h-0.5 w-14 bg-primary" />
        </div>

        <LoginForm />

        <div className="mt-9 border-t border-supremo-outline-variant/30 pt-7 text-center">
          <p className="text-base font-semibold leading-6 text-supremo-on-surface-variant">
            Don&apos;t have an account?
            <Link
              href="/auth/register"
              className="ml-1 font-bold text-primary hover:underline"
            >
              Register here
            </Link>
          </p>
        </div>
      </AuthPanel>
    </AuthShell>
  );
}
