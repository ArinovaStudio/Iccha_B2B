"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Lock, BookOpen } from 'lucide-react';
import PublicHeader from '@/components/layout/PublicHeader';
import Footer from '@/components/layout/Footer';
import {
  CollectionDetail, fetchCollection, isNotFound, isUnauthorized,
} from '@/lib/collection/fetcher';

type State = 'loading' | 'ready' | 'notfound' | 'error';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export default function CollectionDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [state, setState] = useState<State>('loading');

  useEffect(() => {
    if (!slug) return;
    let alive = true;

    fetchCollection(slug)
      .then((data) => {
        if (!alive) return;
        setCollection(data);
        setState('ready');
      })
      .catch((e) => {
        if (!alive) return;
        if (isUnauthorized(e)) {
          // Logged out → send to login, then back here.
          router.replace(`/login?next=${encodeURIComponent(`/collections/${slug}`)}`);
        } else if (isNotFound(e)) setState('notfound');
        else setState('error');
      });

    return () => {
      alive = false;
    };
  }, [slug, router]);

  return (
    <div className="flex flex-col min-h-screen">
      <PublicHeader />

      <main className="flex-1 py-12 bg-[#faf8f5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/collections" className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-[#831843]">
            <ArrowLeft className="h-3.5 w-3.5" />
            All collections
          </Link>

          {state === 'loading' && (
            <div className="mt-6 space-y-8" aria-busy="true">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="h-4 w-24 animate-pulse rounded bg-stone-200" />
                  <div className="h-10 w-3/4 animate-pulse rounded bg-stone-200" />
                  <div className="h-20 animate-pulse rounded bg-stone-200" />
                </div>
                <div className="aspect-[16/10] animate-pulse rounded-3xl bg-stone-200" />
              </div>
            </div>
          )}

          {state === 'notfound' && (
            <div className="mt-8 rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center text-sm text-stone-500">
              This collection isn&rsquo;t available. It may have been removed or hasn&rsquo;t launched yet.
            </div>
          )}

          {state === 'error' && (
            <div role="alert" className="mt-8 rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-800">
              We couldn&rsquo;t load this collection. Please refresh the page.
            </div>
          )}

          {state === 'ready' && collection && (
            <>
              {/* Hero: details + cover image (= first product's image) */}
              <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <span className="text-xs uppercase font-bold tracking-[0.2em] text-[#831843]">
                    {collection.productCount} {collection.productCount === 1 ? 'product' : 'products'}
                  </span>
                  <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">{collection.name}</h1>
                  {collection.description && (
                    <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">{collection.description}</p>
                  )}
                  {collection.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {collection.tags.map((t) => (
                        <span key={t} className="text-[11px] bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded-md font-medium">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-stone-200 bg-stone-100">
                  {collection.coverImage ? (
                    <Image
                      src={collection.coverImage}
                      alt={collection.name}
                      fill
                      priority
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-stone-300">
                      <BookOpen className="h-10 w-10" />
                    </div>
                  )}
                </div>
              </section>

              {/* Products */}
              <section className="mt-14">
                <h2 className="font-serif text-2xl font-bold text-stone-900">Products in this collection</h2>

                {collection.products.length === 0 ? (
                  <p className="mt-6 text-sm text-stone-500">No products in this collection yet.</p>
                ) : (
                  <ul className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
                    {collection.products.map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/catalogue/${p.slug}`}
                          className="group block overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-lg"
                        >
                          <div className="relative aspect-[3/4] w-full bg-stone-100">
                            {p.image ? (
                              <Image
                                src={p.image}
                                alt={p.name}
                                fill
                                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-stone-300">
                                <BookOpen className="h-8 w-8" />
                              </div>
                            )}
                          </div>
                          <div className="space-y-1 p-3 sm:p-4">
                            <p className="font-mono text-[10px] text-stone-400">{p.designNumber}</p>
                            <h3 className="text-sm font-semibold text-stone-900 line-clamp-2">{p.name}</h3>
                            <p className="text-sm font-bold text-[#831843]">
                              {inr.format(p.pricePerSet)}
                              <span className="text-xs font-medium text-stone-500"> / set</span>
                            </p>
                            <p className="flex items-center gap-1 text-[11px] text-stone-500">
                              <Lock className="h-3 w-3 text-rose-800" />
                              {p.piecesPerSet} pcs/set · Min {p.minOrderSets} {p.minOrderSets === 1 ? 'set' : 'sets'}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}