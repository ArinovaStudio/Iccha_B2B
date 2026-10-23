"use client";

import React from "react";
import PublicHeader from '@/components/layout/PublicHeader';
import Footer from '@/components/layout/Footer';

type PolicySection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

type Policy = {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  effectiveDate: string;
  sections: PolicySection[];
};

const policy: Policy = {
  "id": "cookies",
  "label": "Cookie Policy",
  "title": "Cookie Policy",
  "subtitle": "How cookies and similar technologies may support sessions, preferences and site performance.",
  "effectiveDate": "[Insert publication date]",
  "sections": [
    {
      "heading": "1. Introduction",
      "paragraphs": [
        "This Cookie Policy explains how ICCHA Store uses cookies and similar technologies on https://icchastore.com. ICCHA Store operates as a B2B wholesale catalogue and enquiry platform for eligible and verified businesses.",
        "Cookies may help the Website operate securely, maintain user sessions, remember selected preferences, understand Website usage and support other functionality where those features are enabled. This Policy should be read together with our Privacy Policy and Terms and Conditions."
      ]
    },
    {
      "heading": "2. What Are Cookies?",
      "paragraphs": [
        "Cookies are small text files stored on your browser or device when you visit a website. A cookie may contain an identifier or other information used to recognise a browser, maintain a session, remember a preference or support a website function.",
        "Similar technologies may include pixels, tags, local storage, scripts and software development tools that store or access information on a device. Some technologies operate only during a browsing session, while others may remain on your device for a specified period or until deleted."
      ]
    },
    {
      "heading": "3. Categories of Cookies",
      "paragraphs": [
        "Depending on the features and services enabled on the Website, ICCHA Store may use the following categories."
      ],
      "bullets": [
        "Strictly necessary cookies: support essential Website functions, such as maintaining an authenticated user session, supporting login and verification workflows, protecting accounts, maintaining forms and navigation, and recording privacy preferences where supported. These functions may not operate properly if necessary cookies are blocked. They will be handled as permitted by applicable law.",
        "Functional cookies: may remember user preferences or settings, such as language preferences or interface settings, where those features are available. These will be used only where the relevant functionality is deployed.",
        "Analytics and performance cookies: may help us understand aggregate Website usage, including pages visited, navigation patterns and technical problems. These technologies will be enabled only where deployed and in accordance with applicable consent and privacy requirements.",
        "Advertising and marketing cookies: if advertising or marketing technologies are introduced, they may measure campaigns or support relevant advertising. These technologies are not necessary for basic catalogue operation. Where required by law, optional tracking technologies will be activated only after the relevant consent has been obtained.",
        "Third-party cookies and embedded content: embedded media, social features or external service integrations may use cookies under their respective providers’ policies. The specific providers depend on integrations actually enabled on the Website."
      ]
    },
    {
      "heading": "4. Why We Use Cookies",
      "paragraphs": [
        "Where applicable, cookies and similar technologies may be used to:"
      ],
      "bullets": [
        "Operate and secure the Website.",
        "Maintain account sessions and support verification or form workflows.",
        "Remember user preferences.",
        "Understand general Website performance and diagnose technical issues.",
        "Measure optional promotional activities, where deployed and permitted."
      ]
    },
    {
      "heading": "5. Cookies and Payments",
      "paragraphs": [
        "ICCHA Store does not currently provide an on-site payment gateway. Accordingly, the Website does not use a payment gateway to collect online checkout payments under the current Platform model.",
        "If a purchaser and vendor arrange payment independently, the vendor’s or financial service provider’s own website, systems and cookie practices may apply outside the ICCHA Store Website."
      ]
    },
    {
      "heading": "6. Your Cookie Choices",
      "paragraphs": [
        "You may manage cookies through your browser settings and, where available, the Website’s cookie preference controls. Depending on the choices offered by the Website, you may be able to accept or reject optional categories of cookies.",
        "You may configure your browser to block or delete cookies. However, disabling certain cookies may affect account login, session management, preferences or other Website functionality. Where consent is legally required for optional cookies or similar technologies, we will provide an appropriate mechanism to obtain and manage that consent.",
        "Withdrawing consent does not retrospectively make earlier lawful processing unlawful, and some records may need to be retained where required by law."
      ]
    },
    {
      "heading": "7. Third-Party Privacy Practices",
      "paragraphs": [
        "Third-party providers may independently collect or process information when their services are used. ICCHA Store does not control all third-party cookies and cannot guarantee that the policies of independent providers remain unchanged. Where applicable, users should review the privacy and cookie information published by those providers before interacting with their content or services."
      ]
    },
    {
      "heading": "8. Cookie Retention",
      "paragraphs": [
        "Cookies may be session-based or persistent. Session cookies are generally removed when the relevant browsing session ends. Persistent cookies remain until they expire or are deleted, subject to their configuration. The actual duration depends on the specific cookie, service and purpose.",
        "ICCHA Store should maintain an accurate cookie inventory identifying each cookie or similar technology, its name and provider, purpose and category, first-party or third-party status, retention duration, and whether consent is required before activation. The published inventory must reflect the cookies and technologies actually operating on the Website."
      ]
    },
    {
      "heading": "9. Updates to This Cookie Policy",
      "paragraphs": [
        "We may update this Policy when Website features, technology providers, cookie practices or applicable legal requirements change. The latest version will be available on the Website with a revised effective or update date. Where required, material changes will be accompanied by appropriate notice or updated consent options."
      ]
    },
    {
      "heading": "10. Contact",
      "paragraphs": [
        "For questions about this Cookie Policy or the use of cookies on the Website, contact ICCHA Store.",
        "Website: https://icchastore.com\nPrivacy and compliance: compliance@icchastore.com\nCommercial enquiries: wholesale@icchastore.com\nPhone: +91 98251 44550 / +91 94140 88220\nBusiness address: [Confirm and insert the current business address]\nPrivacy Contact: [Insert designated name and designation]"
      ]
    }
  ]
};

const policyLinks = [
  { href: "/terms-and-conditions", label: "Terms & Conditions" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/cookie-policy", label: "Cookie Policy" },
];

export default function CookiePolicyPage() {
  const handleBack = () => {
    if (typeof window !== "undefined") window.history.back();
  };

  return (
    <>
    <PublicHeader />
    <main className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12">
          <a href="/" aria-label="ICCHA Store home" className="inline-flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold tracking-[0.18em] text-white">I</span>
            <span className="truncate text-sm font-semibold tracking-[0.2em] text-slate-950">ICCHA STORE</span>
          </a>
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-500 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            aria-label="Go back to the previous page"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.75 4.5 7.25 10l5.5 5.5M7.5 10h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl px-5 pb-10 pt-14 sm:px-8 sm:pb-14 sm:pt-20 lg:px-12 lg:pt-24">
        <div className="max-w-4xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Legal information · 03 / 03</p>
          <h1 className="text-4xl font-medium tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-6xl">{policy.title}</h1>
          <p className="mt-6 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">{policy.subtitle}</p>
          <p className="mt-5 text-sm text-slate-500">Effective date: {policy.effectiveDate}</p>
          <nav aria-label="Legal policy pages" className="mt-8 flex flex-wrap gap-2">
            {policyLinks.map((item) => {
              const current = item.href === "/cookie-policy";
              return (
                <a
                  key={item.href}
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  className={`rounded-full border px-4 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 ${current ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-950"}`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-5 pb-20 sm:px-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16 lg:px-12 lg:pb-28">
        <aside className="hidden lg:block">
          <nav aria-label="Sections in this policy" className="sticky top-8 rounded-2xl border border-slate-200 bg-white p-5">
            <p className="mb-4 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">On this page</p>
            <div className="max-h-[65vh] space-y-1 overflow-y-auto">
              {policy.sections.map((section, index) => (
                <a
                  key={section.heading}
                  href={`#section-${index + 1}`}
                  className="flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm leading-5 text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                >
                  <span className="pt-0.5 text-xs tabular-nums text-slate-400">{String(index + 1).padStart(2, "0")}</span>
                  <span>{section.heading.replace(/^\d+\.\s*/, "")}</span>
                </a>
              ))}
            </div>
            <div className="my-5 border-t border-slate-100" />
            <p className="px-2 text-xs leading-5 text-slate-500">
              Questions about these policies? Contact <a className="underline decoration-slate-300 underline-offset-4 hover:text-slate-900" href="mailto:compliance@icchastore.com">compliance@icchastore.com</a>.
            </p>
          </nav>
        </aside>

        <article className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white sm:rounded-3xl">
          <div className="border-b border-slate-200 px-6 py-7 sm:px-10 sm:py-9 lg:px-12">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">ICCHA Store · 03 / 03</p>
            <h2 className="mt-3 text-xl font-medium tracking-[-0.025em] text-slate-950 sm:text-2xl">{policy.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Please read this policy carefully. It explains the terms applicable to your use of the Platform.</p>
          </div>
          <div className="divide-y divide-slate-100 px-6 sm:px-10 lg:px-12">
            {policy.sections.map((section, index) => (
              <section key={section.heading} id={`section-${index + 1}`} className="scroll-mt-8 py-7 sm:py-8">
                <h3 className="text-base font-semibold leading-6 tracking-[-0.01em] text-slate-900 sm:text-[17px]">{section.heading}</h3>
                {section.paragraphs?.length ? (
                  <div className="mt-3 space-y-4">
                    {section.paragraphs.map((paragraph, paragraphIndex) => (
                      <p key={paragraphIndex} className="whitespace-pre-line break-words text-sm leading-7 text-slate-600 sm:text-[15px] sm:leading-[1.9]">{paragraph}</p>
                    ))}
                  </div>
                ) : null}
                {section.bullets?.length ? (
                  <ul className="mt-4 space-y-3 pl-1">
                    {section.bullets.map((bullet, bulletIndex) => (
                      <li key={bulletIndex} className="flex gap-3 text-sm leading-7 text-slate-600 sm:text-[15px] sm:leading-[1.85]">
                        <span aria-hidden="true" className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                        <span className="min-w-0 break-words">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>
          <div className="border-t border-slate-200 bg-slate-50/60 px-6 py-6 sm:px-10 lg:px-12">
            <p className="text-sm leading-6 text-slate-600">For questions about this policy, contact <a className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900" href="mailto:compliance@icchastore.com">compliance@icchastore.com</a>.</p>
          </div>
        </article>
      </div>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-slate-900">ICCHA STORE</p>
            <p className="mt-2 text-sm text-slate-500">B2B wholesale catalogue and business enquiries.</p>
          </div>
          <nav aria-label="Footer legal links" className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">
            {policyLinks.map((item) => (
              <a key={item.href} href={item.href} className="transition hover:text-slate-950">{item.label}</a>
            ))}
            <a href="mailto:compliance@icchastore.com" className="transition hover:text-slate-950">Contact</a>
          </nav>
        </div>
        <div className="border-t border-slate-100">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-5 py-4 text-xs leading-5 text-slate-400 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
            <span>© {new Date().getFullYear()} ICCHA Store. All rights reserved.</span>
            <span>For verified business use.</span>
          </div>
        </div>
      </footer>
    </main>
    <Footer />
    </>
  );
}
