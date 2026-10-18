import { ArrowRight, Lock } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

function Craft() {

const btnFill =
  'inline-flex items-center justify-center gap-2 rounded-full bg-black text-white px-8 py-3.5 text-sm font-medium tracking-wide transition-colors duration-200 hover:bg-neutral-800';
const btnOutline =
  'inline-flex items-center justify-center gap-2 rounded-full border border-black text-black px-8 py-3.5 text-sm font-medium tracking-wide transition-colors duration-200 hover:bg-black hover:text-white';
const btnOnDark =
  'inline-flex items-center justify-center gap-2 rounded-full border border-white/40 text-white px-6 py-3.5 text-sm font-medium tracking-wide transition-colors duration-200 hover:bg-white hover:text-black hover:border-white';

  return (
            <section className="relative bg-black text-white border-y border-white/10">

          {/* Full-bleed photo hero: image IS the background, copy sits on top of it */}
          <div className="relative min-h-[640px] sm:min-h-[720px]">
            <Image
              src="https://images.unsplash.com/photo-1551803091-e20673f15770?w=1800&auto=format&fit=crop&q=85"
              alt="Fabric and stitch detail from an IcchaStore production lot"
              fill
              sizes="100vw"
              className="object-cover object-[center_30%] grayscale-[15%]"
              referrerPolicy="no-referrer"
            />
            {/* Left-to-right + bottom fades so copy stays legible against the photo */}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/55 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/5 to-transparent" />
            <div className="absolute inset-0 shadow-[inset_0_0_14vw_4vw_rgba(0,0,0,0.55)]" />

            <div className="absolute top-6 left-4 sm:left-10">
              <span className="inline-flex items-center gap-2 rounded-full bg-black/50 backdrop-blur-md border border-white/15 px-3.5 py-2 text-[11px] font-medium text-white/85">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                Surat unit, cutting floor
              </span>
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-56 sm:pb-16">
              <div className="max-w-xl">
                <h2 className="reveal font-serif text-5xl sm:text-6xl lg:text-7xl font-normal leading-[0.98] tracking-tight">
                  Woven to
                  <br />
                  outlast the
                  <br />
                  season.
                </h2>

                <p
                  className="reveal mt-8 max-w-md text-[15px] sm:text-base text-white/70 leading-relaxed"
                  style={{ '--reveal-delay': '80ms' } as React.CSSProperties}
                >
                  Thoughtful fabric selection, controlled finishing, and careful inspection
                  turn every production lot into something whole sellers can confidently put on
                  the floor.
                </p>

                <div
                  className="reveal grid grid-cols-2 gap-4 max-w-md mt-12"
                  style={{ '--reveal-delay': '140ms' } as React.CSSProperties}
                >
                  <div className="border-t-2 border-white pt-4">
                    <span className="block font-serif text-2xl text-white">01</span>
                    <span className="block mt-1 text-[13px] text-white/60">
                      Fabric selection
                    </span>
                  </div>
                  <div className="border-t-2 border-white/40 pt-4">
                    <span className="block font-serif text-2xl text-white">02</span>
                    <span className="block mt-1 text-[13px] text-white/60">
                      Finish inspection
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hang-tag style verification card, floating over the photo */}
            <div className="absolute inset-x-4 bottom-6 sm:inset-x-auto sm:right-10 sm:bottom-10 z-10">
              <div className="relative max-w-sm ml-auto rounded-md bg-white text-black p-6 sm:p-7 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.7)]">
                {/* thread hole, top-left, like a physical swing tag */}
                {/* <span className="absolute -top-3 left-6 w-4 h-4 rounded-full bg-black border-4 border-white" /> */}
                {/* <span className="absolute -top-6 left-[34px] w-px h-4 bg-neutral-400" /> */}

                <div className="flex items-center gap-1.5 mb-4">
                  <Lock className="w-3.5 h-3.5 text-black" />
                  <span className="text-[11px] font-semibold text-neutral-500">
                    Whole seller access
                  </span>
                </div>

                <h3 className="font-serif text-2xl sm:text-3xl font-medium leading-tight mb-2">
                  See the commercial side.
                </h3>

                <p className="text-[13px] sm:text-[14px] text-neutral-500 leading-relaxed mb-5 max-w-sm">
                  Wholesale rates, live stock, and size ratios unlock once your GSTIN is verified.
                </p>

                <Link href="/register" className={`${btnFill} w-full`}>
                  Apply for verification
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

        </section>
  )
}

export default Craft