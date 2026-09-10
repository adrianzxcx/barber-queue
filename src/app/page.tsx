/**
 * Landing Page - app/page.tsx
 *
 * The primary public-facing page for BarberQueue.
 */
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { RealtimeRefresh } from "@/components/realtime/realtime-refresh";
import { HeroActionButton } from "@/components/ui/hero-action-button";
import { BentoImageCard, BentoContentCard } from "@/components/ui/bento-card";

const HERO_BG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDcG-AMdHHjRZN3PvY8UtHasPMNrqj4vA6PweG2ulJPlllKrowBLi4KqtPYU8S6_bHaGgHtEAhCPnbfaESolNKQi3Ynrkv6FXwXZpydpJgNsyxsKrwovcu18segJfQRzrZn5rCoet4wt7-CGDhJwfN6CUkdIJS1zNo8lB-CkJP_6MfRYE4hDk7EkOKSc-pFZPA-_Cg86Xelwk5NDlsT71hnvCjE4MvyaM0MUDMIDLeuLCqhsG6Nao1RjcUt0Duk-PR5t1XXQORlngk";

const FEATURED_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBbj3Eg2AmfXtCy-B6VnxppHRwjXTv2X8FAPTgC8jYf5d4ovEpZfhN1Py5CkrkSV7xV5heGwPxgOW3_N_r51-laUIey5to_h78huKwwnze7wzrDpX93lTjHxoAYZrl5jIXVIHfjDmp5_u1dKCieHr6tYhKZsWO2okns1G9L2wr_AWwI5mVSG-3Hxtb9j_pHVRIsY9ZFAh18RrKwxqzzfaTAXkGCD1i6aGq9ogyYaveplAH0jslFEupY0djJbBRNWqUmS2dTmMP1xxY";

import { createClient } from "@/lib/supabase/server";
import { CheckCircle, Users, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { AuthShell } from "@/components/layout";
import { AuthPanel } from "@/components/ui/auth-panel";
import { LandingHeaderStatus } from "@/components/landing/landing-header-status";
import { LandingServices } from "@/components/landing/landing-services";
import { getPublicLandingState } from "@/lib/queries/public-landing";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string; error_description?: string }>;
}) {
  const params = await searchParams;
  const code = params.code;
  const error = params.error;

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!exchangeError) {
      return (
        <AuthShell note="Verification Complete.">
          <AuthPanel className="mx-auto w-full max-w-[540px] text-center my-12">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle className="h-10 w-10 text-emerald-400" weight="fill" />
            </div>
            
            <h2 className="mb-4 font-heading text-[34px] uppercase leading-none text-supremo-on-surface">
              Email Confirmed
            </h2>
            
            <p className="mb-8 text-supremo-on-surface-variant text-sm">
              Your email has been verified successfully. You can now close this tab and return to the system window to proceed to your dashboard.
            </p>
          </AuthPanel>
        </AuthShell>
      );
    } else {
      return (
        <AuthShell note="Verification Error.">
          <AuthPanel className="mx-auto w-full max-w-[540px] text-center my-12">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
              <WarningCircle className="h-10 w-10 text-red-400" weight="fill" />
            </div>
            
            <h2 className="mb-4 font-heading text-[34px] uppercase leading-none text-supremo-on-surface">
              Link Invalid or Expired
            </h2>
            
            <p className="mb-8 text-supremo-on-surface-variant text-sm">
              {exchangeError.message || "This confirmation link is invalid or has already been used."}
            </p>
          </AuthPanel>
        </AuthShell>
      );
    }
  }

  if (error) {
    const errorDescription = params.error_description || "Email link is invalid or has expired.";
    return (
      <AuthShell note="Verification Error.">
        <AuthPanel className="mx-auto w-full max-w-[540px] text-center my-12">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <WarningCircle className="h-10 w-10 text-red-400" weight="fill" />
          </div>
          
          <h2 className="mb-4 font-heading text-[34px] uppercase leading-none text-supremo-on-surface">
            Verification Failed
          </h2>
          
          <p className="mb-8 text-supremo-on-surface-variant text-sm">
            {errorDescription}
          </p>
        </AuthPanel>
      </AuthShell>
    );
  }

  const landing = await getPublicLandingState();

  return (
    <>
      <RealtimeRefresh
        channelName="public-landing"
        tables={["queue_tickets", "shop_settings", "services"]}
      />
      <Navbar />

      <main>
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
          <div className="absolute inset-0 z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="w-full h-full object-cover opacity-50"
              src={HERO_BG}
              alt="Premium industrial-style Filipino barbershop interior with exposed brick, leather chairs, and atmospheric spotlighting"
            />
            <div className="absolute inset-0 hero-gradient" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-10 text-center">
            <LandingHeaderStatus
              isOpen={landing.shopIsOpen}
              date={landing.currentDate}
            />

            <div className="mb-6 inline-flex items-center px-4 py-1.5 rounded-full bg-[#891c22]/20 border border-[#891c22]/30 text-[#ffb3b0] text-[14px] font-medium uppercase tracking-[0.2em]">
              Heritage &amp; Precision Since 2017
            </div>

            <h1
              className="text-[64px] leading-[72px] md:text-[96px] md:leading-[100px] text-[#ebe1d6] uppercase mb-6 tracking-tight"
              style={{
                fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
              }}
            >
              Experience The{" "}
              <span className="text-[#f0bf5c]">Supremo</span> Standard
            </h1>

            <p className="text-[18px] leading-7 text-[#d2c5b1] max-w-2xl mx-auto mb-12">
              Masterful grooming meets industrial luxury. We bring high-end
              craftsmanship and precision to every cut, ensuring you leave with
              the authority you deserve.
            </p>

            <div className="grid grid-cols-1 gap-6 max-w-6xl mx-auto md:grid-cols-3">
              <HeroActionButton
                variant="primary"
                icon="group_add"
                title="Join the Global Queue"
                subtitle="Fast-track your next sharp look"
                href="/auth/login"
              />
              <HeroActionButton
                variant="ghost"
                icon="auto_awesome"
                iconFilled
                title="Find Your Style with AI"
                subtitle="Predictive grooming consultation"
                href="#ai-style"
              />
              <div className="relative overflow-hidden rounded-[32px] border-2 border-[#f0bf5c] bg-[#f0bf5c]/10 p-6 text-left shadow-[0_0_35px_rgba(240,191,92,0.22)]">
                <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-[#f0bf5c]/15 text-[#f0bf5c]">
                  <Users className="size-6" weight="fill" />
                </div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#f0bf5c]">
                  Live Queue
                </p>
                <h2
                  className="mt-2 text-[30px] uppercase leading-none text-[#ebe1d6]"
                  style={{ fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif" }}
                >
                  General Queue: {landing.waitingCount} - ~{landing.estimatedWaitMinutes}m Wait
                </h2>
              </div>
            </div>
          </div>
        </section>



        <section className="py-16">
          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:h-[600px]">
              <BentoImageCard
                className="md:col-span-8 min-h-[400px]"
                imageSrc={FEATURED_IMG}
                imageAlt="Close-up of a barber meticulously detailing a client's fade with dramatic lighting and golden highlights"
                title="The Supremo Signature"
                description="Our premier service combining traditional Filipino hospitality with modern industrial precision."
              />

              <div className="md:col-span-4 grid grid-rows-2 gap-6">
                <BentoContentCard
                  icon="diamond"
                  badgeText="Exclusive"
                  title="Queue Lounge"
                  description="Relax in style. Track your live queue status on-screen or via SMS while enjoying complimentary premium beverages and high-speed fiber."
                  backgroundImage={HERO_BG}
                  surface="high"
                />

                <div id="ai-style">
                  <BentoContentCard
                    icon="psychology"
                    iconFilled
                    title="Style AI"
                    description="Personalized recommendations based on your facial structure."
                    surface="default"
                    iconColor="text-[#ffb3b0]"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <LandingServices services={landing.services} />
      </main>

      <Footer />
    </>
  );
}
