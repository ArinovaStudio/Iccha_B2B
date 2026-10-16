import Link from "next/link";
import { ArrowRight, Instagram } from "lucide-react";

const IG_URL = "https://www.instagram.com/iccha_by_prime"; // change to your main handle

const reels = [
  { img: "/images/lookbook3.jpg", tag: "iccha_by_prime", link: "https://www.instagram.com/iccha_by_prime", shift: "translate-y-5" },
  { img: "/images/lookbook2.jpg", tag: "primefashion.bangalore", link: "https://www.instagram.com/primefashion.bangalore", shift: "-translate-y-3" },
  { img: "/images/lookbook1.jpg", tag: "prime.fabric", link: "https://www.instagram.com/prime.fabric", shift: "translate-y-7" },
];

function IgLogo({ className = "" }: { className?: string }) {
  // Swap for <img src="/brand/instagram.png" /> if you have a PNG
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="ig-g" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#feda75" />
          <stop offset=".3" stopColor="#fa7e1e" />
          <stop offset=".55" stopColor="#d62976" />
          <stop offset=".8" stopColor="#962fbf" />
          <stop offset="1" stopColor="#4f5bd5" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="92" height="92" rx="26" fill="url(#ig-g)" />
      <rect x="24" y="24" width="52" height="52" rx="16" fill="none" stroke="#fff" strokeWidth="7" />
      <circle cx="50" cy="50" r="12" fill="none" stroke="#fff" strokeWidth="7" />
      <circle cx="68" cy="32" r="4.5" fill="#fff" />
    </svg>
  );
}

export default function InstagramBanner() {
  return (
    <section className="relative overflow-hidden border-t border-neutral-200 bg-gradient-to-br from-pink-50 via-orange-50 to-indigo-100 py-16 sm:py-24">
      <div className="pointer-events-none absolute -left-24 -top-28 h-96 w-96 rounded-full bg-pink-300/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-28 h-[26rem] w-[26rem] rounded-full bg-orange-300/50 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:gap-14 lg:px-8">
        <div className="reveal">
          <span className="mb-5 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[#831843]">
            <Instagram className="h-4 w-4" /> Follow along
          </span>
          <h2 className="mb-4 font-serif text-4xl font-normal leading-[1.05] tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
            Fresh from our <em className="text-[#831843]">lookbooks</em>
          </h2>
          <p className="mb-8 max-w-md text-[15px] leading-relaxed text-neutral-600">
            See the latest ethnic wear drops, fabric stories and styling reels
            from Iccha and our manufacturing partners. Verified retailers unlock
            wholesale rates, live stock and size ratios.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/register"
              className="inline-flex items-center gap-2 rounded-full border border-black px-8 py-3.5 text-sm font-medium text-black transition-colors hover:bg-black hover:text-white">
              Apply as a retailer
            </Link>
          </div>
          <p className="mt-5 text-sm text-neutral-500">@icchastore.official</p>
        </div>

        <div className="relative grid grid-cols-3 gap-2.5 py-3 sm:gap-4">
          <IgLogo className="animate-ig-float absolute -top-12 right-0 z-10 w-20 drop-shadow-xl sm:-right-8 sm:w-24" />
          <IgLogo className="animate-ig-float absolute -left-6 bottom-2 z-10 hidden w-12 opacity-90 [animation-delay:-2s] sm:block" />

          {reels.map((r) => (
            <Link key={r.tag} href={r.link} target="_blank" rel="noopener noreferrer"
              aria-label={`View ${r.tag} on Instagram`}
              className={`group relative block aspect-[9/16] overflow-hidden border border-white/70 bg-white shadow-[0_24px_50px_-22px_rgba(131,24,67,0.45)] transition-transform duration-300 hover:-translate-y-1.5 hover:scale-[1.02] ${r.shift}`}>
              <img src={r.img} alt={r.tag} className="absolute inset-0 h-full w-full object-cover" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-1 text-xs text-white">
                <span className="truncate font-medium">{r.tag}</span>
                <Instagram className="h-4 w-4 shrink-0 opacity-90" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}