'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  ShieldCheck,
  Truck,
  FileText,
  Phone,
  MapPin,
  ArrowUpRight,
} from 'lucide-react';
import { defaultContact } from '@/lib/site-content';

type ContactBranch = {
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

const phoneDigits = (value: string) => value.replace(/[^+\d]/g, '');

const fallbackContactBranch: ContactBranch = {
  id: 'fallback',
  name: defaultContact.showroomTitle,
  phone: defaultContact.phone,
  whatsapp: defaultContact.whatsapp,
  addressLine: defaultContact.address,
  city: '',
  mapUrl: defaultContact.directionsUrl,
  hours: defaultContact.hours,
  closedDays: defaultContact.closed,
};

export default function Footer() {
  const [contacts, setContacts] = useState<ContactBranch[] | null>(null);

  useEffect(() => {
    fetch('/api/public/contact', { cache: 'no-store' })
      .then((response) => response.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setContacts(json.data);
          return;
        }

        // Match /contact's configured fallback when no branch records exist.
        setContacts([fallbackContactBranch]);
      })
      .catch(() => setContacts([fallbackContactBranch]));
  }, []);

  const quickLinks = [
    { label: 'Home', href: '/' },
    { label: 'New Arrivals', href: '/products?sort=newest' },
    { label: 'Best Sellers', href: '/products?sort=popular' },
    { label: 'All Products', href: '/products' },
    { label: 'About Us', href: '/about' },
    { label: 'Contact Us', href: '/contact' },
  ];
  const retailerLinks = [
    { label: 'Apply as Whole seller', href: '/register' },
    { label: 'Submit KYC', href: '/register/kyc' },
    { label: 'Application Status', href: '/application-status' },
    { label: 'Terms & Conditions', href: '/terms-and-conditions' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Cookie Policy', href: '/cookie-policy' },
  ];
  const categories = [
    { label: '2-Piece Kurtis', href: '/products?category=2-piece-kurtis' },
    { label: '3-Piece Sets', href: '/products?category=3-piece-sets' },
    { label: 'Kurtis', href: '/products?category=kurtis' },
    { label: 'Pants', href: '/products?category=pants' },
    { label: 'Dupattas', href: '/products?category=dupattas' },
  ];

  const highlights = [
    {
      icon: Building2,
      title: 'Direct Manufacturer',
      body: 'Wholesale pricing directly from our manufacturing network.',
    },
    {
      icon: ShieldCheck,
      title: 'Verified B2B Portal',
      body: 'Secure wholesale pricing for approved whole sellers.',
    },
    {
      icon: Truck,
      title: 'Reliable Dispatch',
      body: 'Carefully packed wholesale sets ready for dispatch.',
    },
    {
      icon: FileText,
      title: 'GST Billing',
      body: 'Structured invoices for compliant B2B transactions.',
    },
  ];

  return (
    <footer className="bg-[#111111] text-[#d6cfc4] border-t border-white/10">

      {/* ─────────────────────────────────────────
          B2B HIGHLIGHTS
      ───────────────────────────────────────── */}

      <div className="border-b border-white/[0.08] bg-[#0c0c0c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08]">

            {highlights.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="flex items-start gap-4 py-7 lg:px-7 first:lg:pl-0 last:lg:pr-0"
              >
                <div className="w-10 h-10 shrink-0 rounded-lg border border-white/10 bg-white/[0.04] flex items-center justify-center">
                  <Icon className="w-4 h-4 text-stone-300" />
                </div>

                <div>
                  <h4 className="text-[13px] font-medium text-white mb-1">
                    {title}
                  </h4>

                  <p className="text-[11px] leading-relaxed text-stone-500">
                    {body}
                  </p>
                </div>
              </div>
            ))}

          </div>
        </div>
      </div>


      {/* ─────────────────────────────────────────
          MAIN FOOTER
      ───────────────────────────────────────── */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-10">

          {/* BRAND */}
          <div className="lg:col-span-4">

            <Link href="/" className="inline-flex items-center" aria-label="Iccha - The Women's Label">

              <img
                src="/brand/iccha-logo-compact-light.png"
                alt="Iccha - The Women's Label"
                className="h-28 w-auto"
              />

            </Link>


            <p className="mt-6 text-[12px] leading-[1.8] text-stone-500 max-w-sm">
              A wholesale destination for whole sellers looking for thoughtfully
              curated women&apos;s ethnic wear. Discover stitched 2-piece and
              3-piece sets, kurtis, pants and dupattas at B2B prices.
            </p>


          </div>


          {/* QUICK LINKS */}
          <div className="lg:col-span-2">

            <h4 className="text-[12px] uppercase tracking-[0.16em] text-white font-semibold mb-5">
              Quick Links
            </h4>

            <ul className="space-y-3">

              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-1.5 text-[12px] text-stone-500 hover:text-white transition-colors duration-200"
                  >
                    {link.label}

                    <ArrowUpRight
                      className="w-3 h-3 opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-200"
                    />
                  </Link>
                </li>
              ))}

            </ul>

          </div>


          {/* WHOLE SELLER */}
          <div className="lg:col-span-2">

            <h4 className="text-[12px] uppercase tracking-[0.16em] text-white font-semibold mb-5">
              Whole seller Portal
            </h4>

            <ul className="space-y-3">

              {retailerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[12px] text-stone-500 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}

            </ul>

          </div>


          {/* CONTACT */}
          <section className="min-w-0 lg:col-span-4 lg:pl-20" aria-labelledby="footer-contact-heading">

            <h4 id="footer-contact-heading" className="text-[12px] uppercase tracking-[0.16em] text-white font-semibold mb-5">
              Contact
            </h4>

            {contacts === null ? (
              <div className="flex gap-5 overflow-hidden" aria-label="Loading contact details">
                {[0, 1].map((item) => <div key={item} className="h-20 w-56 shrink-0 animate-pulse" />)}
              </div>
            ) : contacts.length > 0 ? (
              <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain pb-2">
                {contacts.map((contact) => {
                  const location = [contact.city, contact.state].filter(Boolean).join(', ');
                  const cityLine = [location, contact.pincode].filter(Boolean).join(' ');

                  return (
                    <article key={contact.id} className="w-52 shrink-0 snap-start border-l border-white/10 pl-4 first:border-l-0 first:pl-0">
                      <h5 className="break-words text-sm font-semibold leading-snug text-white">{contact.name}</h5>
                      <a className="mt-2 inline-flex items-center gap-2 text-xs text-stone-300 hover:text-white" href={`tel:${phoneDigits(contact.phone)}`}>
                        <Phone className="h-3.5 w-3.5 shrink-0 text-stone-500" />
                        <span className="break-words">{contact.phone}</span>
                      </a>
                      <p className="mt-2 flex min-w-0 items-start gap-2 text-xs leading-relaxed text-stone-400">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-500" />
                        <span className="min-w-0 break-words">{[contact.addressLine, cityLine].filter(Boolean).join(', ')}</span>
                      </p>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-stone-500">Contact details are temporarily unavailable. <Link className="text-stone-300 underline underline-offset-4 hover:text-white" href="/contact">Visit our contact page</Link>.</p>
            )}

          </section>

        </div>


        {/* SOCIAL / CTA STRIP */}
        <div className="mt-12 pt-7 border-t border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">

          <div>
            <p className="text-[12px] text-stone-300 font-medium">
              Ready to stock your store?
            </p>

            <p className="text-[10px] text-stone-600 mt-1">
              Apply for wholesale access and unlock B2B pricing.
            </p>
          </div>


          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-lg bg-white text-[#151515] px-4 py-2.5 text-[11px] font-semibold hover:bg-stone-200 transition-colors duration-200"
          >
            Apply as Whole seller
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>

        </div>

      </div>


      {/* ─────────────────────────────────────────
          BOTTOM BAR
      ───────────────────────────────────────── */}

      <div className="border-t border-white/[0.08] bg-[#090909]">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">

            <p className="text-[10px] text-stone-600 text-center md:text-left">
              © {new Date().getFullYear()} IcchaStore Wholesale Archive.
              All rights reserved.
            </p>


            <div className="flex items-center gap-5">

              <Link
                href="/privacy-policy"
                className="text-[10px] text-stone-600 hover:text-stone-300 transition-colors"
              >
                Privacy
              </Link>

              <Link
                href="/terms"
                className="text-[10px] text-stone-600 hover:text-stone-300 transition-colors"
              >
                Terms
              </Link>

              <Link
                href="/contact"
                className="text-[10px] text-stone-600 hover:text-stone-300 transition-colors"
              >
                Support
              </Link>

            </div>

          </div>

        </div>

      </div>

    </footer>
  );
}
