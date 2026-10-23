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
  "id": "terms",
  "label": "Terms & Conditions",
  "title": "Terms and Conditions",
  "subtitle": "Rules for using ICCHA Store’s B2B wholesale catalogue and enquiry platform.",
  "effectiveDate": "23 October 2026",
  "sections": [
    {
      "heading": "1. Introduction",
      "paragraphs": [
        "Welcome to ICCHA Store, accessible at https://icchastore.com (the “Website” or “Platform”). These Terms and Conditions (“Terms”) govern access to and use of the Website, including product catalogues, vendor listings, wholesale information, business registration, account verification and product or order enquiries.",
        "The Platform is operated by [Full Legal Name of Operating Entity], having its business address at [Full Business Address] (“ICCHA Store”, “ICCHA”, “we”, “us” or “our”). By visiting the Website, registering an account, applying for business verification or submitting an enquiry, you agree to these Terms. If you do not agree, you should discontinue use of the Platform."
      ]
    },
    {
      "heading": "2. Nature of the Platform",
      "paragraphs": [
        "ICCHA Store operates as a business-to-business (B2B) wholesale product discovery and enquiry platform intended for eligible and verified businesses. The Platform enables businesses to discover products offered by participating vendors, manufacturers and suppliers; access restricted business information where eligible; and enquire about pricing, availability, minimum order quantities, specifications and potential orders.",
        "The Website functions primarily as a product catalogue and business enquiry platform. It does not process payments through an on-site payment gateway. Submitting a product enquiry does not, by itself, constitute a completed purchase or create a confirmed order. Any commercial transaction must be separately agreed and confirmed in writing by the relevant seller and the purchasing business."
      ]
    },
    {
      "heading": "3. Business Eligibility and Verification",
      "paragraphs": [
        "The Platform is intended exclusively for legitimate businesses, including eligible retailers, wholesalers, boutiques, resellers, distributors and other commercial purchasers. You must be legally capable of entering into commercial agreements, provide accurate and current business information, submit valid documents when requested, have authority to represent the business, and use the Platform for legitimate commercial purposes.",
        "ICCHA Store may request relevant information or documents, such as business registration details, GSTIN information where applicable, Shop and Establishment registration, business identification documents, an authorised representative’s contact details, or other reasonable evidence of business activity.",
        "Submitting an application does not guarantee approval. Access to restricted products, vendor details or wholesale pricing may be granted only after the required verification is completed. ICCHA Store may reject, suspend or revoke an account where information is incomplete, materially inaccurate, misleading, fraudulent or inconsistent with these Terms or applicable law."
      ]
    },
    {
      "heading": "4. Account Security",
      "paragraphs": [
        "You are responsible for maintaining the confidentiality of your login credentials and for activities conducted through your account. Notify ICCHA Store promptly if you suspect unauthorised access, credential compromise or misuse of your account. You must not share accounts with unauthorised persons, attempt to access another business’s account or circumvent access restrictions.",
        "ICCHA Store may temporarily suspend access where reasonably necessary to protect users, vendors, confidential commercial information or the security of the Platform."
      ]
    },
    {
      "heading": "5. Product Catalogue and Information",
      "paragraphs": [
        "The Website may display product names, photographs, descriptions, fabrics, colours, sizes, specifications, vendor information, indicative prices, availability and other product-related details. We make reasonable efforts to maintain accurate catalogue information. However, product information may change because of supplier updates, manufacturing variations, stock movements, corrections or changes in commercial terms."
      ],
      "bullets": [
        "Product images may differ slightly from actual products in colour, texture, finishing or appearance.",
        "Catalogue information may not reflect the latest stock position or production schedule.",
        "Displayed prices, where available, may be indicative and may change before a quotation is confirmed.",
        "Product specifications, size combinations, packaging, minimum order quantities and customisation options may vary by vendor.",
        "A product listing does not guarantee availability or acceptance of an order."
      ]
    },
    {
      "heading": "6. Vendor Relationships and Responsibilities",
      "paragraphs": [
        "The Platform may feature products from multiple manufacturers, wholesalers, suppliers or other participating vendors. Unless a written quotation, invoice or other transaction document expressly states otherwise, the seller for a proposed transaction is the vendor or legal entity identified in the relevant commercial documentation.",
        "ICCHA Store may facilitate product discovery, enquiries, information sharing and communication between verified businesses and participating vendors. Its precise role in a particular transaction will depend on the relevant written commercial arrangements.",
        "The applicable vendor or seller is responsible for the commitments it makes regarding its products, including confirmed availability, applicable prices, product specifications, fulfilment, dispatch, warranties and other agreed commercial obligations. Before placing an order, the purchaser should confirm the seller’s identity and the party responsible for invoicing, fulfilment, delivery, returns and after-sales support.",
        "Where ICCHA Store itself is identified as the seller or expressly accepts a contractual obligation, its responsibilities will be determined by the relevant agreement and applicable law."
      ]
    },
    {
      "heading": "7. Pricing and Commercial Confidentiality",
      "paragraphs": [
        "Certain product information and wholesale prices may be available only to verified business accounts. You agree to treat non-public wholesale prices, vendor quotations, negotiated rates, pro forma invoices, minimum order conditions, commercial terms and other restricted business information as confidential."
      ],
      "bullets": [
        "Do not publish restricted wholesale prices or confidential quotations on public platforms without permission.",
        "Do not redistribute confidential vendor pricing to unauthorised persons.",
        "Do not use restricted commercial information to impersonate a supplier or misrepresent a quotation.",
        "Do not copy or extract restricted catalogue information for unauthorised commercial redistribution."
      ]
    },
    {
      "heading": "8. Product Enquiries and Order Confirmation",
      "paragraphs": [
        "Users may submit enquiries relating to products, pricing, quantities, samples, availability or proposed purchases. An enquiry, request for quotation, draft basket, expression of interest or similar submission is a request for information or a potential commercial proposal. It is not, by itself, a binding purchase order or an accepted sale.",
        "Before a transaction is confirmed, the relevant parties should establish the terms in writing, including product, design, quantity and specifications; wholesale price and applicable taxes; minimum order quantity; packaging, size ratios and customisation; dispatch timelines, delivery and freight; payment terms and the invoicing seller; and cancellation, replacement, return, warranty and dispute arrangements where applicable.",
        "A purchase becomes binding only when the relevant parties have entered into an enforceable agreement or the seller has expressly accepted the order in accordance with the agreed process."
      ]
    },
    {
      "heading": "9. Minimum Order Quantities and Samples",
      "paragraphs": [
        "Minimum order quantities, set combinations, packaging rules and sample availability may differ between vendors and products. Any quantity or sample arrangement shown in the catalogue or communicated during an enquiry should be confirmed by the relevant seller before purchase. A vendor may decline an order that does not meet its applicable minimum quantity or agreed production requirements, subject to any existing contractual commitment."
      ]
    },
    {
      "heading": "10. Payments, Taxes and Invoicing",
      "paragraphs": [
        "ICCHA Store does not provide an on-site payment gateway under the current Platform model. The Website does not collect payments through a website checkout system. Payment arrangements, where a transaction proceeds, must be confirmed separately with the relevant seller.",
        "Before transferring money, purchasers should independently verify the seller’s legal identity, the invoice or pro forma invoice, the beneficiary name and the payment instructions through a trusted communication channel. Do not rely solely on changed bank details communicated in an unexpected email, message or document.",
        "Applicable GST, other taxes, freight charges, packaging charges and transaction costs will be determined by applicable law and the written commercial terms agreed with the seller. The entity responsible for issuing the tax invoice must be identified in the relevant transaction documents."
      ]
    },
    {
      "heading": "11. Shipping, Fulfilment, Returns and Cancellations",
      "paragraphs": [
        "Shipping, dispatch, fulfilment, delivery, returns, replacements, cancellations and warranties are governed by the transaction terms agreed with the relevant seller. Unless expressly agreed otherwise in writing, submitting an enquiry does not establish a delivery commitment, return entitlement or warranty.",
        "Purchasers should obtain and retain written confirmation of these arrangements before confirming an order. Any dispute concerning a confirmed transaction should first be directed to the party responsible under the applicable commercial agreement. This does not prevent a user from approaching ICCHA Store where the issue concerns the Platform or its own obligations."
      ]
    },
    {
      "heading": "12. Acceptable Use",
      "paragraphs": [
        "You agree not to:"
      ],
      "bullets": [
        "Provide forged documents, false business information or misleading representations.",
        "Impersonate a business, vendor or authorised representative.",
        "Use the Website for unlawful, fraudulent or deceptive activities.",
        "Attempt to obtain unauthorised access to accounts, systems, data or restricted information.",
        "Interfere with the availability, security or operation of the Website.",
        "Use bots, scraping tools or automated extraction methods in violation of access rules or applicable law.",
        "Copy, resell or commercially exploit Website content without permission or another lawful basis.",
        "Distribute malware, spam or harmful material through the Platform.",
        "Misuse another party’s intellectual property or confidential information."
      ]
    },
    {
      "heading": "13. Intellectual Property",
      "paragraphs": [
        "Unless otherwise identified, the Website’s software, design, branding, text, graphics, catalogue layout and other original content are owned by or licensed to the relevant rights holders. Product photographs, brand names, logos and vendor materials may belong to their respective owners.",
        "Access to the Platform does not transfer ownership of intellectual property. You may use the catalogue for legitimate business evaluation, subject to these Terms and any additional restrictions notified to you. You must obtain the necessary permission before reproducing, publishing or commercially redistributing protected material beyond what is permitted by law."
      ]
    },
    {
      "heading": "14. Suspension and Termination",
      "paragraphs": [
        "ICCHA Store may suspend or terminate access where reasonably necessary because of fraudulent activity, misuse of confidential information, security risks, false verification details, violations of these Terms or a legal requirement. Where appropriate and reasonably practicable, we may provide notice and an opportunity to resolve the issue.",
        "Termination of an account does not automatically cancel or discharge obligations under an existing commercial agreement between a purchaser and a seller."
      ]
    },
    {
      "heading": "15. Website Availability and Third-Party Services",
      "paragraphs": [
        "We aim to keep the Platform available and functional, but uninterrupted access cannot be guaranteed. The Website may depend on hosting providers, communication services and other third-party systems. Temporary outages, maintenance, technical failures or external events may affect availability.",
        "The Platform may contain links or references to third-party websites. Those websites operate under their own terms and privacy practices, for which the relevant operators are responsible."
      ]
    },
    {
      "heading": "16. Disclaimers and Limitation of Liability",
      "paragraphs": [
        "To the maximum extent permitted by applicable law, the Website and its catalogue are provided on an “as available” basis. We do not guarantee that every catalogue entry is continuously current, that every enquiry will receive a particular response or that a proposed transaction will be completed.",
        "ICCHA Store is not responsible for a vendor’s independent commercial commitments unless ICCHA Store has expressly undertaken the relevant obligation or applicable law provides otherwise. To the maximum extent permitted by law, ICCHA Store will not be liable for indirect, incidental, special or consequential losses arising from use of the Platform, including loss of profits, business opportunities or anticipated savings.",
        "Nothing in these Terms excludes or limits liability for fraud, wilful misconduct, obligations that cannot lawfully be excluded, or any other liability that applicable law requires to remain enforceable."
      ]
    },
    {
      "heading": "17. Indemnity",
      "paragraphs": [
        "To the extent permitted by applicable law, you agree to be responsible for losses, claims or reasonable costs arising from your unlawful misuse of the Platform, fraudulent representations, infringement of third-party rights or material breach of these Terms. This provision applies only to the extent the relevant loss results from your conduct and does not transfer to you responsibility for matters attributable to ICCHA Store or another party."
      ]
    },
    {
      "heading": "18. Privacy and Cookies",
      "paragraphs": [
        "Use of the Website is also subject to our Privacy Policy and Cookie Policy, which explain how personal data and cookies or similar technologies may be handled. By using the Platform, you acknowledge that these policies apply to your use. Where consent is legally required for a particular processing activity or cookie, such consent will be obtained separately as applicable."
      ]
    },
    {
      "heading": "19. Changes to These Terms",
      "paragraphs": [
        "We may amend these Terms to reflect changes in the Platform, business operations, security requirements or applicable law. The updated version will be published on the Website with its revised effective or updated date. Changes will apply from the stated effective date, subject to applicable law and any existing contractual commitments."
      ]
    },
    {
      "heading": "20. Governing Law and Disputes",
      "paragraphs": [
        "These Terms are governed by the laws of India. The parties will endeavour to resolve disputes through good-faith discussions. If a dispute cannot be resolved, it may be referred to a court or other competent forum having jurisdiction in accordance with applicable law.",
        "Subject to applicable law, the courts at Bengaluru, Karnataka, are intended to have jurisdiction over disputes relating to these Terms. Confirm that this proposed location is appropriate for the operating entity before publication."
      ]
    },
    {
      "heading": "21. Grievance Redressal and Contact",
      "paragraphs": [
        "For questions, complaints or concerns relating to the Website or these Terms, please contact ICCHA Store using the details below. Insert the current legal entity name, business address and designated grievance contact before publishing.",
        "Email: wholesale@icchastore.com (commercial enquiries) · compliance@icchastore.com (privacy and compliance)\nPhone: +91 98251 44550 / +91 94140 88220",
        "Complaints will be acknowledged and addressed within the timelines required by applicable law. If any provision of these Terms is held unenforceable, the remaining provisions will continue to apply to the extent permitted by law."
      ]
    }
  ]
};

const policyLinks = [
  { href: "/terms-and-conditions", label: "Terms & Conditions" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/cookie-policy", label: "Cookie Policy" },
];

export default function TermsAndConditionsPage() {
  const handleBack = () => {
    if (typeof window !== "undefined") window.history.back();
  };

  return (
    <>
    <PublicHeader />
    <main className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12">
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
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Legal information · 01 / 03</p>
          <h1 className="text-4xl font-medium tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-6xl">{policy.title}</h1>
          <p className="mt-6 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">{policy.subtitle}</p>
          <p className="mt-5 text-sm text-slate-500">Effective date: {policy.effectiveDate}</p>
          <nav aria-label="Legal policy pages" className="mt-8 flex flex-wrap gap-2">
            {policyLinks.map((item) => {
              const current = item.href === "/terms-and-conditions";
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
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">ICCHA Store · 01 / 03</p>
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
