import * as React from "react";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";

import { Button } from "@/components/ui/button";

type DashboardHeroProps = {
  image: string;
  onJoinClick?: () => void;
};

function DashboardHero({ image, onJoinClick }: DashboardHeroProps) {
  return (
    <section className="relative min-h-[440px] overflow-hidden rounded-3xl border border-supremo-outline-variant/20 bg-supremo-surface-container">
      <div
        aria-label="Industrial Supremo barber lounge"
        role="img"
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${image})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/50 to-background/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/65 via-transparent to-transparent" />

      <div className="relative z-10 flex min-h-[440px] max-w-xl flex-col justify-center px-8 py-10 md:px-14">
        <p className="mb-5 text-lg font-medium uppercase leading-6 tracking-[0.35em] text-primary">
          Est. 2018 - Manila
        </p>
        <h1 className="font-heading text-[54px] uppercase leading-[0.95] text-supremo-on-surface md:text-[70px]">
          The Supremo Experience
        </h1>
        <p className="mt-6 text-xl font-medium leading-8 text-supremo-on-surface-variant">
          Premium grooming meets industrial precision. Experience the sharpest
          cuts in an atmosphere designed for the modern gentleman.
        </p>
        <Button 
          onClick={onJoinClick}
          className="mt-8 h-16 w-fit rounded-lg bg-primary px-10 text-base font-black uppercase tracking-[0.14em] text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 [&_svg]:size-6 cursor-pointer"
        >
          Join Queue
          <ArrowRightIcon />
        </Button>
      </div>
    </section>
  );
}

export { DashboardHero };
