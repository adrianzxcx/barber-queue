"use client";

import { useState } from "react";
import {
  CheckCircle,
  Clock,
  CurrencyDollar,
  Drop,
  ListChecks,
  Scissors,
  Sparkle,
  Tag,
  Wind,
} from "@phosphor-icons/react";

import type { ServiceCategory, ServiceDTO } from "@/lib/db/types";
import { cn } from "@/lib/utils";

const categories: Array<"All" | ServiceCategory> = ["All", "Haircut", "Beard", "Shave", "Treatment", "Combo"];

const categoryIcons = {
  Haircut: Scissors,
  Beard: Sparkle,
  Shave: Wind,
  Treatment: Drop,
  Combo: ListChecks,
} satisfies Record<ServiceCategory, typeof Scissors>;

export function ServicesClient({ services }: { services: ServiceDTO[] }) {
  const [selectedCategory, setSelectedCategory] = useState<"All" | ServiceCategory>("All");

  const filteredServices =
    selectedCategory === "All"
      ? services
      : services.filter((service) => service.category === selectedCategory);

  return (
    <>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-supremo-outline-variant/15 pb-8">
        <div className="space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary block">
            Grooming Catalog
          </span>
          <h1 className="font-heading text-5xl uppercase leading-none md:text-6xl text-supremo-on-surface">
            Services
          </h1>
          <p className="text-sm text-supremo-on-surface-variant max-w-xl font-light">
            Explore our premium services menu. Filter by category to view our pricing, durations, and details.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 md:pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "px-4 py-2.5 text-xs font-bold uppercase tracking-wider border transition-all duration-300 rounded-lg cursor-pointer select-none",
                selectedCategory === category
                  ? "bg-primary border-primary text-[#17130c] shadow-lg shadow-primary/15"
                  : "border-supremo-outline-variant/35 bg-supremo-surface-container-low text-supremo-on-surface hover:border-primary/50 hover:bg-supremo-surface-container-high"
              )}
            >
              {category === "All" ? "All" : `${category}s`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {filteredServices.map((service) => {
          const ServiceIcon = categoryIcons[service.category];

          return (
            <div
              key={service.id}
              className="group relative rounded-3xl border border-supremo-outline-variant/15 bg-supremo-surface-container-low hover:border-primary/40 p-6 flex flex-col justify-between transition-all duration-500 hover:shadow-[0_15px_40px_rgba(240,191,92,0.06)] hover:-translate-y-1"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-t-3xl" />

              <div className="space-y-5">
                <div className="flex justify-between items-start">
                  <div className="size-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <ServiceIcon size={24} weight="bold" />
                  </div>

                  <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full tracking-wider">
                    <Tag size={10} weight="bold" />
                    {service.category}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="font-heading text-3xl text-supremo-on-surface tracking-wider group-hover:text-primary transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-xs text-supremo-on-surface-variant leading-relaxed min-h-[40px]">
                    {service.description}
                  </p>
                </div>

                <div className="flex items-center gap-4 py-2.5 px-4 bg-supremo-surface-container-high/65 border border-supremo-outline-variant/10 rounded-xl text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-primary">
                    <CurrencyDollar size={16} />
                    {service.price}
                  </div>
                  <div className="h-4 w-px bg-supremo-outline-variant/20" />
                  <div className="flex items-center gap-1.5 text-supremo-on-surface-variant font-medium">
                    <Clock size={16} />
                    {service.duration}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-supremo-on-surface-variant/75">
                    Included:
                  </h4>
                  <ul className="space-y-1.5">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-[11px] text-supremo-on-surface-variant">
                        <CheckCircle size={14} className="text-primary mt-0.5 shrink-0" weight="fill" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
