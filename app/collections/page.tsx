"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Lock, Layers, BookOpen } from 'lucide-react';
import PublicHeader from '@/components/layout/PublicHeader';
import Footer from '@/components/layout/Footer';
import { CollectionListItem, fetchCollections } from '@/lib/collection/fetcher';

export default function CollectionsPage() {
  const [collections, setCollections] = useState<CollectionListItem[] | null>(null); // null = loading
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchCollections()
      .then((data) => alive && setCollections(data))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <PublicHeader />

      <main className="flex-1 py-12 bg-[#faf8f5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12 space-y-3">
            <span className="text-xs uppercase font-bold tracking-[0.2em] text-[#831843]">
              Curated Lookbooks
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
              Wholesale Seasonal Lookbooks
            </h1>
            <p className="text-sm text-stone-600 leading-relaxed">
              Curated ethnic design edits crafted for boutique buyers seeking high-turnover festival, everyday, and bridal collections.
            </p>
          </div>

          {error ? (
            <div role="alert" className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-800">
              We couldn&rsquo;t load the collections. Please refresh the page.
            </div>
          ) : collections === null ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[0, 1].map((i) => (
                <div key={i} className="h-96 animate-pulse rounded-3xl border border-stone-200 bg-white motion-reduce:animate-none" />
              ))}
            </div>
          ) : collections.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center text-sm text-stone-500">
              New collections are on the way. Please check back soon.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {collections.map((book) => (
                <div key={book.id} className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
                  <Link href={`/collections/${book.slug}`} className="group relative block aspect-[16/10] w-full overflow-hidden bg-stone-100">
                    {book.coverImage ? (
                      <Image
                        src={book.coverImage}
                        alt={book.name}
                        fill
                        sizes="(min-width: 768px) 50vw, 100vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-stone-300">
                        <BookOpen className="h-10 w-10" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-stone-900/85 backdrop-blur-md text-amber-300 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow">
                      <Layers className="h-3 w-3" />
                      {book.productCount} {book.productCount === 1 ? 'product' : 'products'}
                    </div>
                  </Link>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-serif text-xl font-bold text-stone-900">
                        <Link href={`/collections/${book.slug}`} className="hover:underline">
                          {book.name}
                        </Link>
                      </h3>
                      {book.description && (
                        <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">{book.description}</p>
                      )}
                      {book.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {book.tags.map((t) => (
                            <span key={t} className="text-[11px] bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded-md font-medium">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-stone-500 font-medium">
                        <Lock className="w-3.5 h-3.5 text-rose-800" />
                        <span>Wholesale rates protected</span>
                      </div>
                      <Link
                        href={`/collections/${book.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#831843] hover:underline"
                      >
                        View collection &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}