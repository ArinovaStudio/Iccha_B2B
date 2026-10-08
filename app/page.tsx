import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Instagram,
  Scissors,
  Building2,
  Lock,
} from 'lucide-react';
import PublicHeader from '@/components/layout/PublicHeader';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/hero/HeroSection';
import RevealInit from '@/components/ui/RevealInit';
//import Showcase from '@/components/hero/Showcase';
import HomeElements from '@/components/hero/Main';

export const dynamic = 'force-dynamic';

const btnFill =
  'inline-flex items-center justify-center gap-2 rounded-full bg-black text-white px-8 py-3.5 text-sm font-medium tracking-wide transition-colors duration-200 hover:bg-neutral-800';

const btnOutline =
  'inline-flex items-center justify-center gap-2 rounded-full border border-black text-black px-8 py-3.5 text-sm font-medium tracking-wide transition-colors duration-200 hover:bg-black hover:text-white';

const btnOnDark =
  'inline-flex items-center justify-center gap-2 rounded-full border border-white/40 text-white px-6 py-3.5 text-sm font-medium tracking-wide transition-colors duration-200 hover:bg-white hover:text-black hover:border-white';

export default async function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <RevealInit />
      <PublicHeader />

      <main className="flex-1">
        <HeroSection />
        <HomeElements />

        <section className="py-24 sm:py-32 bg-white border-t border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="reveal font-serif text-4xl sm:text-5xl lg:text-6xl font-normal text-black tracking-tight leading-[1.05] max-w-3xl mb-16">
              Built for margin, not just volume
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-neutral-200">
              {[
                {
                  icon: Scissors,
                  tier: 'border-t-black',
                  title: 'Organized set lots',
                  body:
                    'Every design is packed in standard, market-tested size combinations — M-38, L-40, XL-42, XXL-44 — so shelves rotate without dead sizes.',
                },
                {
                  icon: Building2,
                  tier: 'border-t-neutral-500',
                  title: 'Custom Piece of Fabric',
                  body:
                    'Discover a versatile range of fabrics tailored to your designs and business needs. Choose from different materials, textures, colours and prints to create distinctive collections that match your customers’ preferences.',
                },
                {
                  icon: Lock,
                  tier: 'border-t-neutral-300',
                  title: 'Wholesale rates stay private',
                  body:
                    'Your retail customers never see our margins or supplier prices. Commercial access is gated behind verified KYC, every time.',
                },
              ].map((item, idx) => (
                <div
                  key={item.title}
                  className={`reveal group border-r border-b border-neutral-200 border-t-2 ${item.tier} p-8 sm:p-10 transition-colors duration-200 hover:bg-neutral-50`}
                  style={
                    {
                      '--reveal-delay': `${idx * 100}ms`,
                    } as React.CSSProperties
                  }
                >
                  <div className="flex items-center gap-3 mb-6">
                    <item.icon
                      className="w-5 h-5 text-black"
                      strokeWidth={1.75}
                    />
                    <h3 className="font-serif text-xl font-medium text-black">
                      {item.title}
                    </h3>
                  </div>

                  <p className="text-[15px] text-neutral-500 leading-relaxed">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. CRAFT, FACTORY VIDEO & REELS */}
        <section className="relative bg-black text-white overflow-hidden border-t border-white/10">
          {/* Full-bleed photo hero */}
          {/*<Showcase />*/}

          {/* Instagram / Lookbooks Gallery Strip */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <div className="pt-12 border-t border-white/10">
              <div className="reveal flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-white/70" />
                  <span className="font-serif text-lg text-white">
                    Recent lookbooks
                  </span>
                </div>

                <span className="text-sm text-white/50">
                  @icchastore.official
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {[
                  {
                    img: '/images/lookbook3.jpg',
                    tag: 'iccha_by_prime',
                    link:
                      'https://www.instagram.com/iccha_by_prime?stkn=MWV4ZW1paHVhdzJ6OA==',
                  },
                  {
                    img: '/images/lookbook2.jpg',
                    tag: 'primefashion.bangalore',
                    link:
                      'https://www.instagram.com/primefashion.bangalore?stkn=MTEwYW92bjJqbm1kYw==',
                  },
                  {
                    img: '/images/lookbook1.jpg',
                    tag: 'prime.fabric',
                    link:
                      'https://www.instagram.com/prime.fabric?stkn=MXBwZmhsMTcyNG00MA==',
                  },
                ].map((reel, idx) => (
                  <Link
                    key={reel.tag}
                    href={reel.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`View ${reel.tag} on Instagram`}
                    className={`reveal relative aspect-[9/16] overflow-hidden border border-white/10 group block ${
                      idx === 0
                        ? 'bg-black'
                        : idx === 1
                          ? 'bg-[#E8E4F2]'
                          : 'bg-[#292929]'
                    }`}
                    style={
                      {
                        '--reveal-delay': `${idx * 70}ms`,
                      } as React.CSSProperties
                    }
                  >
                    <img
                      src={reel.img}
                      alt={reel.tag}
                      className="object-contain w-full h-full absolute inset-0 p-2 transition-all duration-300 ease-out opacity-70 group-hover:opacity-100 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none" />

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 text-sm font-medium text-white pointer-events-none">
                      <span>{reel.tag}</span>
                      <Instagram className="w-4 h-4 shrink-0 opacity-80" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 7. RETAILER REGISTRATION CTA */}
        <section className="py-28 sm:py-36 bg-white border-t border-neutral-200">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <img
              src="/brand/iccha-logo-dark.png"
              alt="Iccha - The Women's Label"
              className="reveal h-36 w-auto mx-auto mb-8"
            />

            <h2 className="reveal font-serif text-5xl sm:text-6xl lg:text-8xl font-normal text-black tracking-tight leading-[1.02] mb-6">
              Ready to stock
            </h2>

            <p className="reveal text-base text-neutral-500 max-w-lg mx-auto leading-relaxed mb-10">
              Join boutique owners and garment retailers across India already
              sourcing from us. Submit your GSTIN for prompt access.
            </p>

            <div className="reveal flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <Link
                href="/register"
                className={`${btnFill} w-full sm:w-auto`}
              >
                Apply as a retailer
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                href="/login"
                className={`${btnOutline} w-full sm:w-auto`}
              >
                Retailer login
              </Link>
            </div>

            <p className="reveal text-sm text-neutral-400">
              Registration requires a GSTIN or valid Shop and Establishment
              proof. Verification takes about 24 business hours.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}