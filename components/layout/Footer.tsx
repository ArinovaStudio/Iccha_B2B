import React from 'react';
import Link from 'next/link';
import {
  Building2,
  ShieldCheck,
  Truck,
  FileText,
  Phone,
  Mail,
  MapPin,
  Lock,
  ArrowUpRight,
} from 'lucide-react';
export default function Footer() {
  const quickLinks = [
    { label: 'Home', href: '/' },
    { label: 'New Arrivals', href: '/products?sort=newest' },
    { label: 'Best Sellers', href: '/products?sort=popular' },
    { label: 'All Products', href: '/products' },
    { label: 'About Us', href: '/about' },
    { label: 'Contact Us', href: '/contact' },
  ];
  const retailerLinks = [
    { label: 'Apply as Retailer', href: '/register' },
    { label: 'Submit KYC', href: '/register/kyc' },
    { label: 'Application Status', href: '/application-status' },
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
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
      body: 'Secure wholesale pricing for approved retailers.',
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

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-12 lg:gap-8">

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
              A wholesale destination for retailers looking for thoughtfully
              curated women's ethnic wear. Discover stitched 2-piece and
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


          {/* RETAILER */}
          <div className="lg:col-span-2">

            <h4 className="text-[12px] uppercase tracking-[0.16em] text-white font-semibold mb-5">
              Retailer Portal
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
          <div className="lg:col-span-2">

            <h4 className="text-[12px] uppercase tracking-[0.16em] text-white font-semibold mb-5">
              Contact
            </h4>

            <div className="space-y-4">

              <a
                href="tel:+919825144550"
                className="flex items-start gap-2.5 group"
              >
                <Phone className="w-3.5 h-3.5 mt-0.5 text-stone-600 group-hover:text-stone-300 transition-colors" />

                <span className="text-[11px] leading-relaxed text-stone-500 group-hover:text-stone-300 transition-colors">
                  +91 98251 44550
                  <br />
                  +91 94140 88220
                </span>
              </a>


              <a
                href="mailto:wholesale@icchastore.com"
                className="flex items-start gap-2.5 group"
              >
                <Mail className="w-3.5 h-3.5 mt-0.5 text-stone-600 group-hover:text-stone-300 transition-colors" />

                <span className="text-[11px] text-stone-500 group-hover:text-stone-300 transition-colors break-all">
                  wholesale@icchastore.com
                </span>
              </a>

            </div>

          </div>

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
            Apply as Retailer
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