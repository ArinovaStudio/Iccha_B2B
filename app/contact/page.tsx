"use client";

import { useEffect, useState } from "react";
import Footer from "@/components/layout/Footer";
import PublicHeader from "@/components/layout/PublicHeader";
import { ContactContent, defaultContact } from "@/lib/site-content";

type Branch = {
  id: string;
  name: string;
  tag?: string | null;
  contactPerson?: string | null;
  phone: string;
  altPhone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  addressLine: string;
  city: string;
  state?: string | null;
  pincode?: string | null;
  mapUrl?: string | null;
  hours?: string | null;
  closedDays?: string | null;
};

/* ------------------------------- icons ---------------------------------- */

const ICONS = {
  pin: [
    "M20 10c0 5.5-8 12-8 12s-8-6.5-8-12a8 8 0 1 1 16 0Z",
    "M14.4 10a2.4 2.4 0 1 1-4.8 0 2.4 2.4 0 0 1 4.8 0Z",
  ],
  phone: [
    "M4 5c0-.6.4-1 1-1h3l1.5 4.5-2 1.5a12 12 0 0 0 6.5 6.5l1.5-2L19 16v3c0 .6-.4 1-1 1h-1C10.5 20 4 13.5 4 6V5Z",
  ],
  mail: ["M4 6h16v12H4z", "M4 7l8 6 8-6"],
  clock: ["M12 3.8a8.2 8.2 0 1 1 0 16.4 8.2 8.2 0 0 1 0-16.4Z", "M12 7.5V12l3 2"],
  chevron: ["M6 9l6 6 6-6"],
} as const;

function Icon({ name, className = "h-[18px] w-[18px]" }: { name: keyof typeof ICONS; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

/* ------------------------------ helpers --------------------------------- */

const digits = (s: string) => s.replace(/[^+\d]/g, "");

// Used only if the database has no contacts yet.
function fallbackBranch(c: ContactContent): Branch {
  return {
    id: "fallback",
    name: c.showroomTitle,
    phone: c.phone,
    whatsapp: c.whatsapp,
    addressLine: c.address,
    city: "",
    mapUrl: c.directionsUrl,
    hours: c.hours,
    closedDays: c.closed,
  };
}

/* ---------------------------- small pieces ------------------------------ */

function Row({ icon, children }: { icon: keyof typeof ICONS; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex-none text-[var(--gold)]">
        <Icon name={icon} />
      </span>
      <div className="min-w-0 text-sm leading-relaxed text-[var(--charcoal)]/75">{children}</div>
    </div>
  );
}

const actionClass =
  "text-sm font-medium text-[var(--gold)] underline-offset-4 hover:underline focus-visible:underline";

function BranchCard({ b }: { b: Branch }) {
  const cityLine = [b.city, b.state].filter(Boolean).join(", ") + (b.pincode ? ` ${b.pincode}` : "");

  return (
    <article className="flex flex-col rounded-2xl border border-[var(--line)] border-t-2 border-t-[var(--gold)] bg-[var(--card)] p-7 sm:p-8">
      {b.tag && <p className="text-sm text-[var(--gold)]">{b.tag}</p>}

      <h3 className="mt-1 [font-family:var(--font-display)] text-2xl leading-snug text-[var(--ink)]">
        {b.name}
      </h3>

      {b.contactPerson && (
        <p className="mt-1 text-sm text-[var(--charcoal)]/60">Contact: {b.contactPerson}</p>
      )}

      <div className="mt-6 space-y-4">
        <Row icon="pin">
          {b.addressLine}
          {cityLine.trim() && (
            <>
              <br />
              {cityLine}
            </>
          )}
        </Row>

        <Row icon="phone">
          <a href={`tel:${digits(b.phone)}`} className="text-[var(--ink)] hover:text-[var(--gold)]">
            {b.phone}
          </a>
          {b.altPhone && (
            <>
              <br />
              <a href={`tel:${digits(b.altPhone)}`} className="hover:text-[var(--ink)]">
                {b.altPhone}
              </a>
            </>
          )}
        </Row>

        {b.email && (
          <Row icon="mail">
            <a href={`mailto:${b.email}`} className="break-all hover:text-[var(--ink)]">
              {b.email}
            </a>
          </Row>
        )}

        {(b.hours || b.closedDays) && (
          <Row icon="clock">
            {b.hours}
            {b.hours && b.closedDays && <br />}
            {b.closedDays}
          </Row>
        )}
      </div>

      <div className="mt-auto flex flex-wrap gap-x-5 gap-y-2 border-t border-[var(--line)] pt-5 mt-7">
        <a href={`tel:${digits(b.phone)}`} className={actionClass}>
          Call
        </a>
        {b.whatsapp && (
          <a
            href={`https://wa.me/${b.whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className={actionClass}
          >
            WhatsApp
          </a>
        )}
        {b.mapUrl && (
          <a href={b.mapUrl} target="_blank" rel="noopener noreferrer" className={actionClass}>
            Directions
          </a>
        )}
      </div>
    </article>
  );
}

function FaqItem({
  q,
  a,
  open,
  onToggle,
}: {
  q: string;
  a: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-t border-[var(--line)] py-4 first:border-t-0 first:pt-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 text-left text-[15px] text-[var(--ink)]"
        aria-expanded={open}
      >
        <span>{q}</span>
        <Icon
          name="chevron"
          className={`h-4 w-4 flex-none transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          open ? "mt-2 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="text-sm leading-relaxed text-[var(--charcoal)]/65">{a}</p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- page ----------------------------------- */

export default function ContactSection() {
  const [content, setContent] = useState<ContactContent>(defaultContact);
  const [branches, setBranches] = useState<Branch[] | null>(null); // null = loading
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // The contact cards, stored in the database
  useEffect(() => {
    fetch("/api/public/contact", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => setBranches(json.success && Array.isArray(json.data) ? json.data : []))
      .catch(() => setBranches([]));
  }, []);

  const list = branches && branches.length ? branches : branches ? [fallbackBranch(content)] : null;

  return (
    <section
      style={
        {
          "--ink": "#2E2620",
          "--paper": "#FAF6EF",
          "--card": "#FFFFFF",
          "--gold": "#B8873B",
          "--line": "#E8E1D3",
          "--charcoal": "#34302A",
        } as React.CSSProperties
      }
      className="bg-[var(--paper)] text-[var(--charcoal)] [font-family:var(--font-body)]"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;500&display=swap');
        :root {
          --font-display: 'Fraunces', ui-serif, Georgia, serif;
          --font-body: 'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif;
        }
      `}</style>

      <PublicHeader />

      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <div className="max-w-xl">
          <p className="text-sm text-[var(--gold)]">{content.eyebrow}</p>
          <h2 className="mt-2 [font-family:var(--font-display)] text-3xl leading-tight text-[var(--ink)] sm:text-4xl">
            {content.title}
          </h2>
          <p className="mt-4 leading-relaxed text-[var(--charcoal)]/70">{content.intro}</p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {list
            ? list.map((b) => <BranchCard key={b.id} b={b} />)
            : [0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-80 animate-pulse rounded-2xl border border-[var(--line)] bg-[var(--card)] motion-reduce:animate-none"
                />
              ))}
        </div>

        <div className="mt-20">
          <h3 className="text-lg text-[var(--ink)]">{content.faqTitle}</h3>
          <div className="mt-3">
            {content.faqs.map((f, i) => (
              <FaqItem
                key={f.question}
                q={f.question}
                a={f.answer}
                open={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </section>
  );
}