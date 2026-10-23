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
  "id": "privacy",
  "label": "Privacy Policy",
  "title": "Privacy Policy",
  "subtitle": "How ICCHA Store handles business registration details, verification records and product enquiries.",
  "effectiveDate": "[Insert publication date]",
  "sections": [
    {
      "heading": "1. Introduction",
      "paragraphs": [
        "ICCHA Store (“ICCHA”, “we”, “us” or “our”) operates https://icchastore.com as a business-to-business (B2B) product discovery, wholesale catalogue and enquiry platform. This Privacy Policy explains how we collect, use, store, disclose and protect information associated with visitors, business applicants, verified account holders, purchasing businesses and people who contact us.",
        "The Platform is operated by [Full Legal Name of Operating Entity], whose business address is [Full Business Address]. We recognise the importance of protecting personal information, maintaining the confidentiality of business records and using information only for appropriate purposes."
      ]
    },
    {
      "heading": "2. Scope of This Policy",
      "paragraphs": [
        "This Policy applies to information collected through the Website, including business registrations, account verification, product enquiries, communications, support requests and related Platform activities. It also applies to information provided by an authorised representative when acting on behalf of a business.",
        "When a participating vendor independently collects information for its own transaction, its processing may be governed by that vendor’s own privacy policy and legal responsibilities."
      ]
    },
    {
      "heading": "3. Information We May Collect",
      "paragraphs": [
        "Depending on how you use the Platform, we may collect the following categories of information."
      ],
      "bullets": [
        "Business information: registered business name, trading name, business type and address, GSTIN or other registration information where applicable, supporting registration documents, business website or profile, and relevant supplier information.",
        "Applicant and representative information: full name, business role, mobile or WhatsApp number where supplied, business email, login credentials, account identifiers and communications with our team.",
        "Verification information: documents or details provided to demonstrate that you are authorised to act for a legitimate business. We aim to request information relevant to business verification and access control. Please do not submit unnecessary personal documents or sensitive personal information unless specifically requested for a lawful and clearly explained purpose.",
        "Enquiry and commercial information: products or categories of interest, requested quantities, sizes and specifications, preferred vendors, relevant delivery requirements, quotations, communications and order-related information shared through the Platform.",
        "Technical and usage information: depending on the features enabled, IP address, browser and device details, pages visited, timestamps, session information and security-related events collected through server logs, cookies and similar technologies."
      ]
    },
    {
      "heading": "4. How We Use Information",
      "paragraphs": [
        "We may use information for the following purposes:"
      ],
      "bullets": [
        "Business verification: assessing registration applications and confirming eligibility for restricted wholesale access.",
        "Account management: creating, maintaining and securing accounts and managing account status.",
        "Product enquiries: responding to questions about products, pricing, availability, minimum order quantities and potential orders.",
        "Vendor coordination: sharing relevant enquiry details with the vendor or supplier responsible for the requested product.",
        "Commercial administration: maintaining quotations, correspondence and records needed to manage business relationships.",
        "Website operations: maintaining, troubleshooting and improving the Platform.",
        "Security and fraud prevention: detecting suspicious activity, unauthorised access, false applications and misuse.",
        "Legal compliance: meeting applicable accounting, tax, recordkeeping, reporting or other legal obligations.",
        "Communications: sending service messages, verification updates, enquiry responses and other account-related information.",
        "Optional promotional communications: sharing marketing messages where permitted by applicable law and subject to relevant consent or opt-out requirements."
      ]
    },
    {
      "heading": "5. Legal Basis and Consent",
      "paragraphs": [
        "We handle personal data in accordance with applicable Indian data protection and other relevant laws. Where consent is required, we will seek consent for the relevant purpose and provide a means of withdrawing it, subject to applicable law.",
        "Information may also need to be processed to provide a requested service, maintain a business account, respond to an enquiry, comply with legal obligations or protect legitimate business and security interests, where such processing is permitted by applicable law. We will explain the relevant purpose when collecting information where required.",
        "If you submit information about another person, such as an employee or authorised representative, you should ensure that you are authorised to provide it and that the person has received any notice required by law."
      ]
    },
    {
      "heading": "6. Sharing Information with Vendors and Third Parties",
      "paragraphs": [
        "We do not sell personal data as a standalone commercial product. We may share relevant information with the following categories of recipients when necessary for the purposes described in this Policy."
      ],
      "bullets": [
        "Participating vendors and suppliers: when you request information about a product or submit an enquiry, we may share your business name, contact information, requested products, quantities, business requirements and other details reasonably necessary for the vendor to respond.",
        "Service providers: hosting, secure data storage, business communications, technical support, account management, analytics and other operational providers may process information on our behalf, subject to appropriate contractual, security and legal requirements.",
        "Professional advisers: lawyers, accountants, auditors, insurers or other professional advisers where necessary.",
        "Legal authorities: where required by law, a valid legal process, a competent authority or lawful request, or where reasonably necessary to protect legal rights and security.",
        "Business transfers: in a merger, restructuring, acquisition or transfer, information may be disclosed or transferred as part of that process, subject to applicable law and appropriate safeguards."
      ]
    },
    {
      "heading": "7. Data Minimisation and Vendor Enquiries",
      "paragraphs": [
        "We aim to share only the information reasonably necessary for the relevant enquiry or service. Where practicable, do not include unnecessary personal details in product enquiries. Vendor information shared for a commercial enquiry should not be treated as permission for unrelated marketing or other uses."
      ]
    },
    {
      "heading": "8. Payments and Financial Information",
      "paragraphs": [
        "The Website currently operates without an on-site payment gateway. We do not collect payment card details, UPI credentials or online checkout payment credentials through a Website payment-processing system because such a system is not provided under the current Platform model.",
        "If a commercial transaction proceeds directly between a purchaser and a seller, the parties may exchange payment or banking information independently. Information provided directly to a vendor or financial institution is subject to the relevant recipient’s privacy practices and applicable law. Please verify payment instructions and the identity of the receiving party before transferring money."
      ]
    },
    {
      "heading": "9. Data Storage and Security",
      "paragraphs": [
        "We take reasonable technical and organisational measures appropriate to the nature of the information we handle to protect it against unauthorised access, disclosure, alteration, misuse or loss. Measures may include access controls, restricted permissions, secure transmission, authentication procedures, backups and appropriate service-provider safeguards, depending on the systems deployed.",
        "Access to business verification records should be limited to authorised personnel and service providers who need the information for relevant purposes. No method of online transmission or electronic storage can be guaranteed to be completely secure. We will respond to security incidents in accordance with applicable legal requirements and our incident-response procedures."
      ]
    },
    {
      "heading": "10. Data Retention",
      "paragraphs": [
        "We retain information for as long as reasonably necessary for maintaining and securing business accounts, verifying business eligibility, responding to product enquiries, maintaining relevant commercial correspondence, resolving disputes, preventing fraud and meeting applicable legal, tax, accounting and recordkeeping requirements.",
        "Different categories of information may be retained for different periods. When information is no longer required, we will take appropriate steps to delete, anonymise or securely dispose of it, subject to applicable law, legitimate recordkeeping requirements and the need to preserve relevant evidence.",
        "ICCHA Store should maintain an internal retention schedule specifying periods for registration documents, inactive accounts, enquiries, technical logs and other records."
      ]
    },
    {
      "heading": "11. Data Transfers",
      "paragraphs": [
        "Our service providers or vendors may operate in locations outside your state or country. Where personal data is transferred to another location, we will comply with applicable restrictions, requirements and safeguards governing such transfers. The identity and location of material service providers should be assessed as part of our privacy and security compliance process."
      ]
    },
    {
      "heading": "12. Your Privacy Rights",
      "paragraphs": [
        "Subject to applicable law, the rights available to you may include:"
      ],
      "bullets": [
        "Requesting information about the handling of your personal data.",
        "Requesting correction or updating of inaccurate or incomplete information.",
        "Requesting deletion of information that is no longer required or otherwise eligible for deletion.",
        "Withdrawing consent for processing based on consent.",
        "Raising concerns or complaints about our handling of personal data.",
        "Exercising other rights available under applicable law."
      ]
    },
    {
      "heading": "13. Requests and Account Closure",
      "paragraphs": [
        "Requests may need to be verified before we act, to prevent unauthorised disclosure or changes. We may retain certain information where required by law or where a lawful basis continues to apply, even if you request deletion or close an account. Where information relates to a business, requests may be submitted by the relevant individual or an appropriately authorised business representative.",
        "We may review accounts that remain inactive for an extended period and may deactivate or restrict them in accordance with our account-management practices. Where reasonably practicable, users may be provided with instructions for reactivation. Account closure does not necessarily result in immediate deletion of all records, as certain records may need to be retained for legal, security or commercial reasons."
      ]
    },
    {
      "heading": "14. Children's Privacy",
      "paragraphs": [
        "The Platform is intended for legitimate business use and is not designed for children to register independently or access restricted business services. We do not knowingly seek personal information from children for independent account registration. If we identify information collected contrary to applicable law, we will take appropriate steps to address it."
      ]
    },
    {
      "heading": "15. Third-Party Websites and Services",
      "paragraphs": [
        "The Website may contain links to vendor pages, social media accounts, external websites or other third-party services. We do not control every third party’s privacy practices. You should review the relevant third party’s privacy policy before providing information directly to it. This Policy does not replace the privacy policies of independent vendors or other organisations acting as separate controllers of information."
      ]
    },
    {
      "heading": "16. Changes to This Privacy Policy",
      "paragraphs": [
        "We may update this Policy to reflect changes in our business model, the Platform, data-handling practices or applicable law. The latest version will be published on the Website with a revised effective or update date. Where required, we will provide additional notice or seek consent before implementing material changes."
      ]
    },
    {
      "heading": "17. Contact and Grievance Redressal",
      "paragraphs": [
        "For privacy requests, questions or complaints, contact ICCHA Store. Insert the current legal entity name, business address and designated privacy or grievance contact before publishing.",
        "Website: https://icchastore.com\nPrivacy and compliance: compliance@icchastore.com\nCommercial enquiries: wholesale@icchastore.com\nPhone: +91 98251 44550 / +91 94140 88220\nBusiness address: [Confirm and insert the current business address]\nPrivacy or Grievance Contact: [Insert designated name and designation]\nAdditional contact details: [Insert postal address and any legally required details]",
        "We will review and respond to requests in accordance with applicable law and the procedures established for privacy and grievance handling."
      ]
    }
  ]
};

const policyLinks = [
  { href: "/terms-and-conditions", label: "Terms & Conditions" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/cookie-policy", label: "Cookie Policy" },
];

export default function PrivacyPolicyPage() {
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
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Legal information · 02 / 03</p>
          <h1 className="text-4xl font-medium tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-6xl">{policy.title}</h1>
          <p className="mt-6 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">{policy.subtitle}</p>
          <p className="mt-5 text-sm text-slate-500">Effective date: {policy.effectiveDate}</p>
          <nav aria-label="Legal policy pages" className="mt-8 flex flex-wrap gap-2">
            {policyLinks.map((item) => {
              const current = item.href === "/privacy-policy";
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
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">ICCHA Store · 02 / 03</p>
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
