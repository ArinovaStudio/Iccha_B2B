"use client";

import { useState } from "react";
import axios from "axios";
import Footer from "@/components/layout/Footer";
import PublicHeader from "@/components/layout/PublicHeader";
import { ContactContent, defaultContact } from "@/lib/site-content";
import { useEffect } from "react";

type Status = "idle" | "loading" | "success" | "error";

type FormState = {
  name: string;
  shopName: string;
  phone: string;
  email: string;
  city: string;
  message: string;
};

const initialForm: FormState = {
  name: "",
  shopName: "",
  phone: "",
  email: "",
  city: "",
  message: "",
};


/* ------------------------------- icons ---------------------------------- */

function MapPinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path
        d="M20 10c0 5.5-8 12-8 12s-8-6.5-8-12a8 8 0 1 1 16 0Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="10"
        r="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path
        d="M4 5c0-.6.4-1 1-1h3l1.5 4.5-2 1.5a12 12 0 0 0 6.5 6.5l1.5-2L19 16v3c0 .6-.4 1-1 1h-1C10.5 20 4 13.5 4 6V5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="8.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 7.5V12l3 2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`h-3.5 w-3.5 flex-none stroke-current transition-transform duration-300 ${
        open ? "rotate-180" : ""
      }`}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 6l4 4 4-4"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        d="M5 13l4 4L19 7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4A8 8 0 1 1 20 11.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 8.5c.3-.5.6-.5.9-.5h.5c.2 0 .4.1.5.4l.7 1.7c.1.2 0 .4-.1.6l-.5.6c.7 1.2 1.7 2.2 3 2.8l.5-.6c.2-.2.4-.2.6-.1l1.6.8c.3.1.4.3.3.6-.2.7-.8 1.3-1.5 1.5-1.2.3-3.1-.6-4.7-2.1-1.5-1.5-2.4-3.3-2.1-4.5.1-.5.2-.8.3-.9Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 animate-spin"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ---------------------------- small pieces ------------------------------ */

function InfoRow({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 border-t border-[var(--line)] py-5 first:border-t-0 first:pt-0">
      <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-[var(--gold)]/40 text-[var(--gold)]">
        {icon}
      </div>

      <div>
        <h3 className="text-[15px] font-medium text-[var(--ink)]">
          {title}
        </h3>

        <div className="mt-1 text-sm leading-relaxed text-[var(--charcoal)]/70">
          {children}
        </div>
      </div>
    </div>
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
        <ChevronIcon open={open} />
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          open
            ? "mt-2 grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="text-sm leading-relaxed text-[var(--charcoal)]/65">
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  value,
  onChange,
  required = false,
  textarea = false,
  placeholder,
}: {
  label: string;
  name: keyof FormState;
  type?: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  required?: boolean;
  textarea?: boolean;
  placeholder?: string;
}) {
  const shared =
    "w-full rounded-md border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 text-sm text-[var(--charcoal)] outline-none transition-colors duration-200 placeholder:text-[var(--charcoal)]/35 focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]/40";

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-[var(--ink)]/70">
        {label}
      </span>

      {textarea ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          rows={12}
          className={shared}
        />
      ) : (
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className={shared}
        />
      )}
    </label>
  );
}

/* -------------------------------- page ----------------------------------- */

export default function ContactSection() {
  const [content, setContent] = useState<ContactContent>(defaultContact);
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<Status>("idle");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    fetch("/api/public/site-content", { cache: "no-store" }).then((r) => r.json()).then((json) => {
      if (json.success && json.data?.contact) setContent({ ...defaultContact, ...json.data.contact });
    }).catch(() => undefined);
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setStatus("loading");

    /*
     * Open a blank tab immediately while we're still inside the
     * user click event. This prevents popup blockers from blocking
     * WhatsApp after the API request finishes.
     */
    const whatsappWindow = window.open("", "_blank");

    try {
      const response = await axios.post("/api/contact", { ...form, whatsappNumber: content.whatsapp });

      const whatsappUrl = response.data?.whatsappUrl;

      if (!whatsappUrl) {
        whatsappWindow?.close();

        throw new Error("WhatsApp URL was not returned by the server.");
      }

      /*
       * Send the opened tab to WhatsApp.
       */
      if (whatsappWindow) {
        whatsappWindow.location.href = whatsappUrl;
      } else {
        /*
         * Fallback if the browser blocked the popup.
         */
        window.location.href = whatsappUrl;
      }

      setStatus("success");
      setForm(initialForm);
    } catch (error) {
      console.error("Contact form error:", error);

      whatsappWindow?.close();

      setStatus("error");
    }
  }

  return (
    <section
      style={
        {
          "--ink": "#2E2620",
          "--paper": "#FAF6EF",
          "--card": "#FFFFFF",
          "--gold": "#B8873B",
          "--rose": "#9C5A56",
          "--success": "#4B6B4F",
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

        @keyframes riseIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .rise {
          animation: riseIn 0.45s ease-out forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .rise {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>

      <PublicHeader />

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-16 px-6 py-20 sm:py-28 lg:grid-cols-[1fr_1.1fr] lg:gap-20">

        {/* ------------------------------ Left column ------------------------------ */}

        <div>
          <p className="text-sm text-[var(--gold)]">{content.eyebrow}</p>

          <h2 className="mt-2 [font-family:var(--font-display)] text-3xl leading-tight text-[var(--ink)] sm:text-4xl">
            {content.title}
          </h2>

          <p className="mt-4 max-w-md leading-relaxed text-[var(--charcoal)]/70">
            {content.intro}
          </p>

          <div className="mt-8">
            <InfoRow
              icon={<MapPinIcon />}
              title={content.showroomTitle}
            >
              {content.address}
              <br />

              <a
                href={content.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--gold)] underline-offset-2 hover:underline"
              >
                {content.directionsLabel}
              </a>
            </InfoRow>

            <InfoRow
              icon={<PhoneIcon />}
              title={content.phoneTitle}
            >
              <a
                href={`tel:${content.phone.replace(/[^+\d]/g, "")}`}
                className="hover:text-[var(--ink)]"
              >
                {content.phone}
              </a>

              <br />

              <a
                href={`https://wa.me/${content.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--gold)] underline-offset-2 hover:underline"
              >
                {content.whatsappLabel}
              </a>
            </InfoRow>

            <InfoRow
              icon={<ClockIcon />}
              title={content.hoursTitle}
            >
              {content.hours}
              <br />
              {content.closed}
            </InfoRow>
          </div>

          <div className="mt-10">
            <h3 className="text-lg text-[var(--ink)]">
              {content.faqTitle}
            </h3>

            <div className="mt-1">
              {content.faqs.map((f, i) => (
                <FaqItem
                  key={f.question}
                  q={f.question}
                  a={f.answer}
                  open={openFaq === i}
                  onToggle={() =>
                    setOpenFaq(openFaq === i ? null : i)
                  }
                />
              ))}
            </div>
          </div>
        </div>

        {/* ------------------------------ Right column ------------------------------ */}

        <div className="rounded-2xl border-t-2 border-[var(--gold)] bg-[var(--card)] p-7 shadow-[0_2px_24px_-8px_rgba(46,38,32,0.12)] sm:p-9">

          <h3 className="[font-family:var(--font-display)] text-2xl text-[var(--ink)]">
            {content.formTitle}
          </h3>

          <p className="mt-1.5 text-sm text-[var(--charcoal)]/60">
            {content.formIntro}
          </p>

          {status === "success" ? (
            <div className="rise mt-10 flex flex-col items-center py-6 text-center">

              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--success)]/40 text-[var(--success)]">
                <CheckIcon />
              </div>

              <p className="mt-4 text-[var(--ink)]">
                Your enquiry has been prepared for WhatsApp.
              </p>

              <p className="mt-1 max-w-sm text-sm leading-relaxed text-[var(--charcoal)]/60">
                WhatsApp should have opened with all your details ready.
              </p>

              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="mt-4 text-sm text-[var(--gold)] underline underline-offset-2"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-7 space-y-5"
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                <Field
                  label="Your name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Full name"
                />

                <Field
                  label="Shop / business name"
                  name="shopName"
                  value={form.shopName}
                  onChange={handleChange}
                  required
                  placeholder="Your store"
                />

                <Field
                  label="Phone number"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  placeholder="10-digit mobile"
                />

                <Field
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                />

              </div>

              <Field
                label="City"
                name="city"
                value={form.city}
                onChange={handleChange}
                required
                placeholder="Where's your store?"
              />

              <Field
                label="What are you looking for?"
                name="message"
                value={form.message}
                onChange={handleChange}
                textarea
                required
                placeholder="Categories, quantity, and any style preferences"
              />

              {status === "error" && (
                <div className="rounded-md border border-[var(--rose)]/20 bg-[var(--rose)]/5 px-4 py-3">
                  <p className="text-sm text-[var(--rose)]">
                    Something went wrong sending your enquiry. Please try
                    again.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[var(--ink)] px-6 py-3 text-sm font-medium text-[var(--paper)] transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {status === "loading" && <Spinner />}

                {status === "loading"
                  ? "Preparing WhatsApp…"
                  : content.submitLabel}
              </button>

              <p className="text-xs leading-relaxed text-[var(--charcoal)]/45">
                {content.formNote}
              </p>
            </form>
          )}
        </div>
      </div>

      <Footer />
    </section>
  );
}
