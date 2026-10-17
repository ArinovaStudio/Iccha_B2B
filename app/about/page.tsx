"use client";

import Footer from "@/components/layout/Footer";
import PublicHeader from "@/components/layout/PublicHeader";
import { useEffect, useRef, useState } from "react";
import { AboutContent, defaultAbout } from "@/lib/site-content";


function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

function useInView<T extends HTMLElement>(threshold = 0.25) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function useCountUp(target: number, active: boolean, duration = 1100) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) {
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return value;
}

/* ---------------------------- image reveal ----------------------------- */

function RevealImage({
  src,
  alt,
  className = "",
  delay = 0,
}: {
    src: string;
  alt: string;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>(0.15);
  return (
    <div
      ref={ref}
      style={{
        opacity: reduced || inView ? 1 : 0,
        transform: reduced || inView ? "scale(1)" : "scale(0.96)",
        transition: `opacity 0.8s ease-out ${delay}s, transform 0.8s ease-out ${delay}s`,
      }}
      className="overflow-hidden"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className={className} loading="lazy" />
    </div>
  );
}

/* ------------------------------- buttons -------------------------------- */

function PrimaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="group inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--ink),#ffae21)] px-7 py-3 text-sm font-medium text-[var(--paper)] shadow-[0_10px_30px_-10px_rgba(28,37,65,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-8px_rgba(28,37,65,0.6)]"
    >
      {children}
      <svg
        viewBox="0 0 16 16"
        className="h-3.5 w-3.5 fill-none stroke-current transition-transform duration-300 group-hover:translate-x-1"
        aria-hidden="true"
      >
        <path
          d="M2 8h11M9 4l4 4-4 4"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  );
}

function SecondaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 rounded-full border border-[var(--ink)]/25 bg-white/50 px-7 py-3 text-sm font-medium text-[var(--ink)] backdrop-blur-sm transition-all duration-300 hover:border-[var(--ink)]/50 hover:bg-[linear-gradient(135deg,rgba(217,142,43,0.14),rgba(162,59,59,0.14))]"
    >
      {children}
    </a>
  );
}

function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} fill-current`} aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2Zm5.8 14.13c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.12.11-1.8-.11-.42-.13-.96-.31-1.65-.6-2.9-1.25-4.8-4.16-4.94-4.35-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.12 1.01-2.41.27-.29.58-.36.78-.36.19 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.83 2 .9 2.14.07.15.12.32.02.51-.09.19-.14.31-.28.48-.14.16-.29.36-.41.48-.14.14-.28.29-.12.56.16.28.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.22 1.37.28.14.44.12.6-.07.16-.19.68-.79.87-1.06.18-.28.37-.23.62-.14.25.09 1.6.76 1.87.9.27.14.45.21.52.32.07.12.07.68-.17 1.35Z" />
    </svg>
  );
}

/* ---------------------------- decoration -------------------------------- */

function GradientBlob({ className }: { className: string }) {
  return <div aria-hidden="true" className={`pointer-events-none absolute rounded-full blur-3xl ${className}`} />;
}

function GradientRule() {
  return (
    <div
      aria-hidden="true"
      className="h-px w-full bg-[linear-gradient(90deg,transparent,var(--line),transparent)]"
    />
  );
}

/* ------------------------------- data --------------------------------- */

const categories = [
  {
    src: "https://picsum.photos/id/1005/600/750",
    alt: "Menswear rack — placeholder, swap for Iccha Store's own photo",
    label: "Menswear",
  },
  {
    src: "https://picsum.photos/id/1027/600/750",
    alt: "Womenswear rack — placeholder, swap for Iccha Store's own photo",
    label: "Womenswear",
  },
  {
    src: "https://picsum.photos/id/1011/600/750",
    alt: "Kidswear rack — placeholder, swap for Iccha Store's own photo",
    label: "Kidswear",
  },
  {
    src: "https://picsum.photos/id/1025/600/750",
    alt: "Ethnic wear rack — placeholder, swap for Iccha Store's own photo",
    label: "Ethnic wear",
  },
];

const stats = [
  { value: 800, suffix: "+", label: "retailers supplied" },
  { value: 1200, suffix: "+", label: "styles in catalog" },
  { value: 14, suffix: "", label: "states shipped to" },
  { value: 48, suffix: "h", label: "average dispatch time" },
];

const steps = [
  {
    title: "Share your requirement",
    body: "Call, WhatsApp, or walk into the showroom with your size run and style list.",
  },
  {
    title: "We pull your stock",
    body: "Straight from live inventory — no waiting on lines that are out of stock.",
  },
  {
    title: "Check and pack",
    body: "Every piece is checked for size and stitching before it leaves the floor.",
  },
  {
    title: "Dispatch to your store",
    body: "Packed by carton, billed by GST invoice, sent on the transport you choose.",
  },
];

const reasons = [
  {
    title: "No minimum surprises",
    body: "MOQ is fixed per style upfront, so your order total is never a guess at the counter.",
  },
  {
    title: "Fresh stock, every week",
    body: "New lots land weekly across sarees, kurtis, casual wear, and kidswear.",
  },
  {
    title: "Billing you can reconcile",
    body: "Clean GST invoices and stock lists, matched line by line to what actually ships.",
  },
];

const navLinks = [
  { href: "#story", label: "Our story" },
  { href: "#floor", label: "Catalog" },
  { href: "#contact", label: "Contact" },
];

/* ------------------------------ page ----------------------------------- */

export default function IcchaStoreAbout() {
  const [content, setContent] = useState<AboutContent>(defaultAbout);
  const reduced = useReducedMotion();

  useEffect(() => {
    fetch("/api/public/site-content", { cache: "no-store" }).then((r) => r.json()).then((json) => {
      if (json.success && json.data?.about) setContent({ ...defaultAbout, ...json.data.about });
    }).catch(() => undefined);
  }, []);

  const story = useInView<HTMLDivElement>();
  const numbers = useInView<HTMLDivElement>(0.4);
  const work = useInView<HTMLDivElement>(0.2);
  const why = useInView<HTMLDivElement>(0.2);

  return (
    <main
      style={
        {
          "--ink": "#e89300",
          "--paper": "#F5EFE1",
          "--card": "#FBF7EC",
          "--turmeric": "#D98E2B",
          "--thread": "#A23B3B",
          "--line": "#E3D9C3",
          "--charcoal": "#22262F",
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
        @keyframes stitchDraw {
          from { stroke-dashoffset: 1; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 0.55; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        .hero-line-draw {
          animation: stitchDraw 1.4s ease-out 0.2s forwards;
        }
        .hero-rise-0 { animation: riseIn 0.7s ease-out 0.3s forwards; opacity: 0; }
        .hero-rise-1 { animation: riseIn 0.7s ease-out 0.5s forwards; opacity: 0; }
        .hero-rise-2 { animation: riseIn 0.7s ease-out 0.7s forwards; opacity: 0; }
        .hero-rise-3 { animation: riseIn 0.7s ease-out 0.9s forwards; opacity: 0; }
        .pulse-ring {
          animation: pulseRing 2.2s ease-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-line-draw, .hero-rise-0, .hero-rise-1, .hero-rise-2, .hero-rise-3 {
            animation: none !important;
            opacity: 1 !important;
            stroke-dashoffset: 0 !important;
            transform: none !important;
          }
          .pulse-ring { animation: none !important; display: none; }
        }
      `}</style>

      <PublicHeader />

      {/* ---------------------------- Hero ---------------------------- */}
      <section id="top" className="relative overflow-hidden">
        <GradientBlob className="-top-32 -right-20 h-96 w-96 bg-[radial-gradient(circle,var(--turmeric),transparent_70%)] opacity-40" />
        <GradientBlob className="top-40 -left-24 h-80 w-80 bg-[radial-gradient(circle,var(--thread),transparent_70%)] opacity-25" />

        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-6 pt-16 pb-24 sm:grid-cols-2 sm:gap-10 sm:pt-24 sm:pb-32">
          <div>
            <span className="hero-rise-0 inline-flex items-center gap-2 rounded-full border border-[var(--ink)]/15 bg-[var(--card)] px-4 py-1.5 text-xs text-[var(--ink)]/80 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[linear-gradient(135deg,var(--turmeric),var(--thread))]" />
              {content.heroBadge}
            </span>

            <h1 className="hero-rise-2 mt-6 [font-family:var(--font-display)] text-4xl sm:text-5xl leading-[1.1] text-[var(--ink)]">
              {content.heroTitle}
            </h1>

            <svg
              viewBox="0 0 300 24"
              className="my-7 h-5 w-40"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2,12 Q27,0 52,12 T102,12 T152,12 T202,12 T252,12 T298,12"
                stroke="var(--turmeric)"
                strokeWidth="2"
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={1}
                className={reduced ? "" : "hero-line-draw"}
                style={reduced ? undefined : { strokeDashoffset: 1 }}
              />
            </svg>

            <p className="hero-rise-3 max-w-lg text-lg leading-relaxed text-[var(--charcoal)]/85">
              {content.heroBody}
            </p>

            <div className="hero-rise-3 mt-9 flex flex-wrap gap-4">
              <PrimaryButton href={content.heroPrimaryUrl}>{content.heroPrimaryLabel}</PrimaryButton>
              <SecondaryButton href={content.whatsappUrl}>{content.whatsappLabel}</SecondaryButton>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-3 -z-10 rounded-2xl bg-[linear-gradient(135deg,var(--turmeric),var(--thread))] opacity-30 blur-2xl" />
            <RevealImage
              src={content.heroImage}
              alt={content.heroImageAlt}
              className="h-72 w-full rounded-2xl object-cover shadow-xl sm:h-[40rem]"
              delay={0.15}
            />
            <div
              className="absolute -bottom-6 -left-6 hidden rounded-xl border border-[var(--line)] bg-[var(--card)] px-5 py-4 shadow-lg sm:block"
              style={{
                opacity: reduced ? 1 : undefined,
              }}
            >
              <div className="h-1 w-8 rounded-full bg-[linear-gradient(90deg,var(--turmeric),var(--thread))]" />
              <div className="mt-2 [font-family:var(--font-display)] text-2xl text-[var(--ink)]">{content.dispatchValue}</div>
              <div className="text-xs text-[var(--ink)]/60">{content.dispatchLabel}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------- Story ---------------------------- */}
      <section id="story" className="relative">
        <div className="mx-auto px-6">
          <GradientRule />
        </div>
        <div
          ref={story.ref}
          className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 py-20 sm:grid-cols-2 sm:py-28"
        >
          <div className="flex flex-col justify-center">
            <h2 className="[font-family:var(--font-display)] text-3xl text-[var(--ink)]">
              {content.storyTitle}
            </h2>
            <p className="mt-5 leading-relaxed text-[var(--charcoal)]/85">
              {content.storyBody}
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-2 -z-10 rounded-2xl bg-[linear-gradient(135deg,rgba(217,142,43,0.35),rgba(162,59,59,0.35))] blur-xl" />
            <RevealImage
              src={content.storyImage}
              alt={content.storyImageAlt}
              className="h-72 w-full rounded-2xl object-cover shadow-lg sm:h-full"
            />
          </div>
        </div>
      </section>

      {/* ------------------------- Categories --------------------------- */}
      <section id="floor" className="relative">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <h2 className="[font-family:var(--font-display)] text-3xl text-[var(--ink)]">
            {content.categoriesTitle}
          </h2>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
            {content.categories.map((c, i) => (
              <div key={c.label} className="group relative">
                <div className="relative overflow-hidden rounded-2xl">
                  <RevealImage
                    src={c.image}
                    alt={c.alt}
                    className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    delay={0.1 * i}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(28,37,65,0.55),transparent_55%)]" />
                  <p className="absolute bottom-3 left-4 text-sm font-medium text-[var(--paper)]">
                    {c.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------- Numbers --------------------------- */}
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,var(--ink)_0%,#4A1F2C_100%)]">
        <GradientBlob className="-bottom-24 -right-24 h-72 w-72 bg-[radial-gradient(circle,var(--turmeric),transparent_70%)] opacity-25" />
        <div
          ref={numbers.ref}
          className="relative mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-10 px-6 py-16 sm:grid-cols-4 sm:py-20"
        >
          {content.stats.map((s, i) => (
            <Stat key={i} {...s} active={numbers.inView} />
          ))}
        </div>
      </section>

      {/* ------------------------- How we work -------------------------- */}
      <section className="relative">
        <div
          ref={work.ref}
          className="mx-auto max-w-2xl px-6 py-20 sm:py-28"
        >
          <h2 className="[font-family:var(--font-display)] text-3xl text-[var(--ink)]">
            {content.stepsTitle}
          </h2>

          <ol className="mt-12 space-y-0">
            {content.steps.map((step, i) => (
              <li key={i} className="relative flex gap-6 pb-10 last:pb-0">
                {i < steps.length - 1 && (
                  <span
                    className="absolute left-[15px] top-9 w-px bg-[linear-gradient(180deg,var(--turmeric),var(--thread))]"
                    style={{
                      height: "calc(100% - 2rem)",
                      transform: work.inView || reduced ? "scaleY(1)" : "scaleY(0)",
                      transformOrigin: "top",
                      transition: `transform 0.6s ease-out ${0.15 * i + 0.2}s`,
                    }}
                    aria-hidden="true"
                  />
                )}
                <span className="relative z-10 flex h-8 w-8 flex-none items-center justify-center rounded-full border border-[var(--ink)] bg-[var(--card)] text-sm text-[var(--ink)] shadow-sm">
                  {i + 1}
                </span>
                <div className="pt-0.5">
                  <h3 className="text-lg text-[var(--ink)]">{step.title}</h3>
                  <p className="mt-1 leading-relaxed text-[var(--charcoal)]/80">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------- Why retailers ------------------------ */}
      <section className="relative">
        <div ref={why.ref} className="mx-auto max-w-2xl px-6 py-20 sm:py-28">
          <h2 className="[font-family:var(--font-display)] text-3xl text-[var(--ink)]">
          {content.reasonsTitle}
          </h2>

          <div className="mt-10">
            {content.reasons.map((r, i) => (
              <div key={i} className="py-6">
                <div
                  className="h-px bg-[linear-gradient(90deg,var(--turmeric),var(--thread))]"
                  style={{
                    transform: why.inView || reduced ? "scaleX(1)" : "scaleX(0)",
                    transformOrigin: "left",
                    transition: `transform 0.7s ease-out ${0.15 * i}s`,
                  }}
                />
                <h3 className="mt-6 text-lg text-[var(--ink)]">{r.title}</h3>
                <p className="mt-1 leading-relaxed text-[var(--charcoal)]/80">
                  {r.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------ CTA ------------------------------ */}
      <section id="contact" className="relative overflow-hidden">
        <GradientBlob className="top-10 left-1/2 h-80 w-80 -translate-x-1/2 bg-[radial-gradient(circle,var(--turmeric),transparent_70%)] opacity-20" />
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-20 sm:grid-cols-2 sm:py-28">
          <div className="flex flex-col items-start gap-6">
            <h2 className="[font-family:var(--font-display)] text-3xl text-[var(--ink)]">
              {content.ctaTitle}
            </h2>
            <p className="max-w-md leading-relaxed text-[var(--charcoal)]/85">
              {content.ctaBody}
            </p>
            <div className="flex flex-wrap gap-4">
              <PrimaryButton href={`mailto:${content.catalogEmail}`}>
                {content.heroPrimaryLabel}
              </PrimaryButton>
              <SecondaryButton href={content.whatsappUrl}>{content.whatsappLabel}</SecondaryButton>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-2 -z-10 rounded-2xl bg-[linear-gradient(135deg,rgba(28,37,65,0.35),rgba(162,59,59,0.3))] blur-xl" />
            <RevealImage
              src={content.ctaImage}
              alt={content.ctaImageAlt}
              className="h-64 w-full rounded-2xl object-cover shadow-lg sm:h-[30rem]"
            />
          </div>
        </div>
      </section>

<Footer />

      {/* -------------------- Floating WhatsApp CTA --------------------- */}
      <a
        href={content.whatsappUrl}
        className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--turmeric),var(--thread))] px-5 py-3 text-sm font-medium text-[var(--paper)] shadow-lg transition-transform duration-300 hover:-translate-y-0.5"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-[var(--paper)]" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--paper)]" />
        </span>
        <WhatsAppIcon />
        {content.whatsappLabel}
      </a>
    </main>
  );
}

/* ----------------------------- sub-parts ------------------------------- */

function Stat({
  value,
  suffix,
  label,
  active,
}: {
  value: number;
  suffix: string;
  label: string;
  active: boolean;
}) {
  const count = useCountUp(value, active);
  return (
    <div className="border-l border-[var(--paper)]/20 pl-4 first:border-l-0 first:pl-0">
      <div className="[font-family:var(--font-display)] text-3xl text-[var(--paper)] sm:text-4xl">
        {count.toLocaleString()}
        {suffix}
      </div>
      <div className="mt-1 text-sm text-[var(--paper)]/70">{label}</div>
    </div>
  );
}
