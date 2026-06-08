import Link from "next/link";
import {
  ArrowRightIcon,
} from "@phosphor-icons/react/dist/ssr";

import { AuthShell } from "@/components/layout";
import { AuthPanel } from "@/components/ui/auth-panel";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <AuthShell
      note="Precision is not an act, it's a habit."
      mainClassName="py-4 md:py-5"
    >
      <AuthPanel className="mx-auto w-full max-w-[560px] border-t border-primary/20 p-5 md:p-6 lg:p-7">
        <div className="mb-5 text-center lg:hidden">
          <h1 className="font-heading text-[46px] uppercase leading-none text-primary">
            Supremo Lounge
          </h1>
          <p className="mt-2 text-sm font-bold uppercase leading-5 tracking-widest text-supremo-on-surface-variant">
            Registration
          </p>
        </div>

        <div className="mb-4">
          <h2 className="font-heading text-[30px] uppercase leading-none text-supremo-on-surface">
            Create Account
          </h2>
          <p className="mt-2 text-base font-medium leading-6 text-supremo-on-surface-variant">
            Step into the elite circle of Supremo.
          </p>
        </div>

        <RegisterForm />

        <div className="mt-4 border-t border-supremo-outline-variant/30 pt-3 text-center">
          <p className="text-base font-semibold leading-6 text-supremo-on-surface-variant">
            Already have an account?
            <Link
              href="/auth/login"
              className="ml-1 inline-flex items-center gap-1 text-xl font-bold leading-7 text-primary transition-colors hover:text-supremo-surface-tint"
            >
              Log In
              <ArrowRightIcon className="size-[18px]" />
            </Link>
          </p>
        </div>
      </AuthPanel>
    </AuthShell>
  );
}
