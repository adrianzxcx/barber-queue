/**
 * Footer — components/layout/footer.tsx
 *
 * Full-width site footer with:
 *  - Brand block + tagline + social icons
 *  - Operating hours table
 *  - Contact information
 *  - Copyright bar with legal links
 *
 * Reused across all public-facing pages.
 */
/** Operating hours data — easy to update from one place */
const HOURS: { day: string; time: string; closed?: boolean }[] = [
  { day: "Mon - Fri", time: "9AM - 9PM" },
  { day: "Saturday", time: "10AM - 8PM" },
  { day: "Sunday", time: "Closed", closed: true },
];

/** Contact details */
const CONTACT = {
  address: ["123 Industrial Dr.", "Manila, Philippines"],
  phone: "+63 917 123 4567",
  email: "hello@supremobarber.com",
} as const;

export function Footer() {
  return (
    <footer className="bg-[#110e08] pt-16 pb-12 border-t border-[#4e4637]/20">
      <div className="max-w-7xl mx-auto px-5 md:px-10">
        {/* Top grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand column (spans 2 on desktop) */}
          <div className="md:col-span-2">
            <div
              className="text-[40px] leading-[48px] tracking-[0.02em] text-[#f0bf5c] uppercase mb-6"
              style={{ fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif" }}
            >
              Supremo Barber
            </div>
            <p className="text-[#d2c5b1] max-w-sm mb-8 text-base leading-6">
              Setting the global benchmark for masculine grooming. Precision,
              craftsmanship, and authority in every stroke.
            </p>
            {/* Social icons */}
            <div className="flex gap-4">
              <SocialIcon icon="mail" href={`mailto:${CONTACT.email}`} label="Email Supremo Barber" />
              <SocialIcon icon="call" href={`tel:${CONTACT.phone.replace(/\s/g, "")}`} label="Call Supremo Barber" />
            </div>
          </div>

          {/* Operating Hours */}
          <div>
            <FooterHeading>Operating Hours</FooterHeading>
            <ul className="space-y-4 text-[#d2c5b1] text-base">
              {HOURS.map((h) => (
                <li key={h.day} className="flex justify-between">
                  <span>{h.day}</span>
                  <span
                    className={
                      h.closed
                        ? "text-[#ffb3b0] font-bold"
                        : "text-[#ebe1d6]"
                    }
                  >
                    {h.time}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <FooterHeading>Contact</FooterHeading>
            <ul className="space-y-4 text-[#d2c5b1] text-base">
              <li>
                {CONTACT.address[0]}
                <br />
                {CONTACT.address[1]}
              </li>
              <li>{CONTACT.phone}</li>
              <li>{CONTACT.email}</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[#4e4637]/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#d2c5b1]/60 text-sm">
            © {new Date().getFullYear()} Supremo Barber. All Rights Reserved.
          </p>
          <div className="flex gap-8 text-sm text-[#d2c5b1]/60">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ---- Small helpers (private to this file) ---- */

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h5 className="text-[#ebe1d6] text-[14px] leading-5 font-medium uppercase tracking-[0.05em] mb-6">
      {children}
    </h5>
  );
}

function SocialIcon({ icon, href, label }: { icon: string; href: string; label: string }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="w-10 h-10 rounded-full border border-[#4e4637] flex items-center justify-center text-[#d2c5b1] hover:text-[#f0bf5c] hover:border-[#f0bf5c] transition-all"
    >
      <span className="material-symbols-outlined">{icon}</span>
    </a>
  );
}
