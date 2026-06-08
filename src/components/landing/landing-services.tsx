"use client";

import React, { useState } from "react";
import { Clock, Tag } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface ServiceItem {
  name: string;
  price: string;
  duration: string;
  description: string;
  category: "Haircut" | "Beard" | "Shave" | "Treatment" | "Combo";
}

const SERVICES: ServiceItem[] = [
  {
    name: "SUPREMO CUT",
    price: "$35.00",
    duration: "30 mins",
    description: "Signature precision haircut and style finished with a straight-razor neck shave.",
    category: "Haircut",
  },
  {
    name: "BEARD SCULPT",
    price: "$20.00",
    duration: "20 mins",
    description: "Expert beard shaping, lining, and conditioning with premium beard oil.",
    category: "Beard",
  },
  {
    name: "LINE UP",
    price: "$15.00",
    duration: "15 mins",
    description: "Quick clean-up of the hairline, sideburns, and neckline.",
    category: "Haircut",
  },
  {
    name: "CLASSIC SHAVE",
    price: "$25.00",
    duration: "30 mins",
    description: "Traditional hot towel wet shave using a straight razor and premium shave soap.",
    category: "Shave",
  },
  {
    name: "SCALP TREATMENT",
    price: "$30.00",
    duration: "25 mins",
    description: "Invigorating tea tree oil scalp massage and deep conditioning therapy.",
    category: "Treatment",
  },
  {
    name: "VIP PACKAGE",
    price: "$60.00",
    duration: "50 mins",
    description: "The ultimate package: Supremo Cut, Beard Sculpt, hot towel shave, and scalp massage.",
    category: "Combo",
  },
];

export function LandingServices() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", "Haircut", "Beard", "Shave", "Treatment", "Combo"];
  const filteredServices = selectedCategory === "All"
    ? SERVICES
    : SERVICES.filter((s) => s.category === selectedCategory);

  return (
    <section id="services" className="py-20 bg-[#17130c]/50 border-t border-supremo-outline-variant/15 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-5 md:px-10 space-y-12">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-supremo-outline-variant/15 pb-6">
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary block">
              Premium Grooming Menu
            </span>
            <h2 className="font-heading text-[42px] uppercase leading-none md:text-[54px] text-supremo-on-surface">
              Our Services
            </h2>
            <p className="text-sm text-supremo-on-surface-variant max-w-lg">
              Explore our curated selection of haircuts, traditional shaves, and custom treatments crafted for the modern gentleman.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-all rounded-none cursor-pointer",
                  selectedCategory === cat
                    ? "bg-primary border-primary text-[#17130c] shadow-md shadow-primary/10"
                    : "border-supremo-outline-variant/30 text-supremo-on-surface hover:border-primary/50"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.name}
              className="bg-[#231f18] border border-supremo-outline-variant/30 p-6 flex flex-col justify-between hover:border-primary/40 transition-all shadow-lg group relative"
            >
              {/* Gold top accent line on hover */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />

              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-heading text-2xl text-supremo-on-surface tracking-wider group-hover:text-primary transition-colors">
                    {service.name}
                  </h3>
                  <span className="font-heading text-xl text-primary tracking-wide leading-none mt-1">
                    {service.price}
                  </span>
                </div>
                
                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 tracking-wider">
                  <Tag size={10} />
                  {service.category}
                </span>

                <p className="text-xs text-supremo-on-surface-variant leading-relaxed min-h-[48px]">
                  {service.description}
                </p>
              </div>

              <div className="pt-4 border-t border-supremo-outline-variant/15 mt-6 flex justify-between items-center text-[10px] text-supremo-on-surface-variant uppercase font-semibold">
                <span className="flex items-center gap-1.5">
                  <Clock size={12} className="text-primary" />
                  Duration: {service.duration}
                </span>
                <span className="text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  Book Now
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
