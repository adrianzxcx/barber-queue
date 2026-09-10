import type { LandingServiceDTO } from "@/lib/queries/public-landing";

interface LandingServicesProps {
  services: LandingServiceDTO[];
}

export function LandingServices({ services }: LandingServicesProps) {
  return (
    <section id="services" className="py-28 relative overflow-hidden bg-[#17130c]/30 border-t border-supremo-outline-variant/15 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-5 md:px-10 relative z-10 space-y-20">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary block">
            Premium Offerings
          </span>
          <h2 className="font-heading text-[48px] uppercase leading-none md:text-[64px] text-supremo-on-surface">
            Grooming Pillars
          </h2>
          <div className="h-[2px] w-16 bg-primary mx-auto my-4" />
          <p className="text-[15px] leading-relaxed text-supremo-on-surface-variant font-light max-w-xl mx-auto">
            We provide refined haircuts, classic hot-towel shaves, and custom scalp treatments crafted with absolute precision.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((pillar) => (
            <div
              key={pillar.id}
              className="group relative overflow-hidden bg-gradient-to-b from-[#231f18] to-[#1a1711] border border-supremo-outline-variant/20 hover:border-primary/45 p-8 rounded-2xl transition-all duration-500 hover:shadow-[0_15px_40px_rgba(240,191,92,0.08)] min-h-[260px]"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/8 via-transparent to-transparent transition-opacity duration-500 pointer-events-none" />

              <div className="absolute top-0 left-0 right-0 h-[3px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

              <div className="flex justify-between items-start">
                <div className="size-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary transition-all duration-500 group-hover:bg-primary group-hover:text-black">
                  <span className="material-symbols-outlined text-3xl font-medium">
                    {pillar.icon}
                  </span>
                </div>
                <span className="font-heading text-6xl text-supremo-outline-variant/25 group-hover:text-primary/20 transition-colors duration-500 tracking-wider select-none">
                  {pillar.num}
                </span>
              </div>

              <div className="mt-8 space-y-3">
                <h3 className="font-heading text-3xl uppercase tracking-wider text-supremo-on-surface group-hover:text-primary transition-colors duration-300">
                  {pillar.name}
                </h3>
                <p className="text-xs md:text-sm text-supremo-on-surface-variant/90 leading-relaxed font-light">
                  {pillar.description}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
