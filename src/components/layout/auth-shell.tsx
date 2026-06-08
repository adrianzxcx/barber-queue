import * as React from "react";

import { cn } from "@/lib/utils";

const authBrandImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDOvik7ZJuNxCVH5AD9zPKIK0Dri-scyp3a6n1kqTgoskD8-rG24zH-wyykFXFUFAPqRFJvO7HzX2iTa-eEzLFgHwfXwhSuja_SLO4xb4urou1_A_2uNT7RNbCzoBC8v-bN9r4U_1p3hR5sbO7SKEIkcZZrQIIbj3XcLwLQmLL13Elky83TRd8RSXf-5wsSNYEzkz3e78adcb4TyII0vztEbE-6vToBej6h8FJsnTwRntbszh305tqi6P29javjHAF9aRemj-ekj8c";

type AuthShellProps = {
  children: React.ReactNode;
  note?: React.ReactNode;
  className?: string;
  mainClassName?: string;
};

function AuthShell({
  children,
  note,
  className,
  mainClassName,
}: AuthShellProps) {
  return (
    <main
      className={cn(
        "industrial-pattern relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-container-padding-mobile py-12 text-supremo-on-surface md:px-container-padding-desktop",
        mainClassName
      )}
    >
      <div className="pointer-events-none absolute -left-[5%] -top-[10%] h-[40%] w-[40%] rounded-full bg-primary/5 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-[10%] -right-[5%] h-[40%] w-[40%] rounded-full bg-secondary/10 blur-[120px]" />

      <div
        className={cn(
          "relative z-10 grid w-full max-w-[1120px] items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]",
          className
        )}
      >
        <AuthBrandPanel />
        <section className="w-full">
          {children}
          {note ? (
            <p className="mt-6 text-center text-sm font-medium uppercase leading-5 tracking-[0.3em] text-supremo-on-surface/40">
              {note}
            </p>
          ) : null}
        </section>
      </div>

      <footer className="pointer-events-none absolute bottom-6 z-20 hidden w-full text-center sm:block">
        <p className="text-[10px] font-medium uppercase tracking-widest text-supremo-outline-variant">
          (c) 2024 BarberQueue Systems | Supremo Lounge
        </p>
      </footer>
    </main>
  );
}

function AuthBrandPanel() {
  return (
    <section className="hidden flex-col space-y-8 pr-6 lg:flex">
      <div>
        <h1 className="font-heading text-[56px] uppercase leading-none tracking-[0.02em] text-primary xl:text-display-lg">
          Supremo Lounge
        </h1>
        <div className="mt-6 h-1 w-24 bg-primary" />
      </div>

      <p className="max-w-md text-xl font-medium leading-8 text-supremo-on-surface-variant">
        Experience the pinnacle of grooming. Join our exclusive community for
        precision cuts, AI-driven style recommendations, and priority queue
        access.
      </p>

      <div className="group relative aspect-[4/5] max-h-[560px] overflow-hidden rounded-xl border border-supremo-outline-variant/30 shadow-2xl">
        <div
          aria-label="Luxury vintage barber shop interior"
          role="img"
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url(${authBrandImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/5 to-transparent opacity-90" />
        <div className="absolute bottom-6 left-6 right-6">
          <span className="block font-heading text-[30px] uppercase leading-none text-primary">
            Crafted For You
          </span>
          <span className="mt-2 block text-sm font-semibold uppercase leading-5 tracking-[0.25em] text-supremo-on-surface-variant">
            The Golden Standard of Barbering
          </span>
        </div>
      </div>
    </section>
  );
}

export { AuthBrandPanel, AuthShell };
