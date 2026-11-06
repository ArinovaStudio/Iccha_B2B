import Link from "next/link";
import { ArrowRight, Instagram } from "lucide-react";

const IG_URL = "https://www.instagram.com/iccha_by_prime"; // change to your main handle

const reels = [
  { img: "/images/lookbook3.jpg", tag: "iccha_by_prime", link: "https://www.instagram.com/iccha_by_prime" },
  { img: "/images/lookbook2.jpg", tag: "primefashion.bangalore", link: "https://www.instagram.com/primefashion.bangalore" },
  { img: "/images/lookbook1.jpg", tag: "prime.fabric", link: "https://www.instagram.com/prime.fabric" },
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
            from Iccha and our manufacturing partners. Verified Wholesalers unlock
            wholesale rates, live stock and size ratios.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/register"
              className="inline-flex items-center gap-2 rounded-full border border-black px-8 py-3.5 text-sm font-medium text-black transition-colors hover:bg-black hover:text-white">
              Apply as a Wholesaler
            </Link>
          </div>
          <p className="mt-5 text-sm text-neutral-500">@icchastore.official</p>
        </div>

        <div className="relative mx-auto grid w-full max-w-xl grid-cols-3 items-start justify-items-center gap-2 py-6 sm:gap-5 sm:py-8">
          <IgLogo className="animate-ig-float absolute -right-1 -top-3 z-10 w-12 drop-shadow-xl sm:-right-5 sm:-top-5 sm:w-16" />

          {reels.map((r, index) => (
            <Link key={r.tag} href={r.link} target="_blank" rel="noopener noreferrer"
              aria-label={`View ${r.tag} on Instagram`}
              className={`group flex w-full min-w-0 flex-col items-center text-center transition-transform duration-300 hover:-translate-y-1 ${index === 1 ? 'mt-7 sm:mt-10' : ''}`}>
              <span className="relative block w-full max-w-[132px] rounded-full bg-[conic-gradient(from_220deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5,#feda75)] p-[3px] shadow-[0_18px_38px_-20px_rgba(131,24,67,0.65)] sm:max-w-[168px] sm:p-1">
                <span className="block aspect-square overflow-hidden rounded-full border-[3px] border-white bg-white sm:border-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.img} alt={`${r.tag} Instagram lookbook`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                </span>
                <span className="absolute bottom-[7%] right-[5%] flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white text-[#c13584] shadow-md sm:h-10 sm:w-10">
                  <Instagram className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
              </span>
              <span className="mt-3 max-w-full truncate text-[10px] font-semibold tracking-wide text-stone-700 transition-colors group-hover:text-[#831843] sm:mt-4 sm:text-xs">
                @{r.tag}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
