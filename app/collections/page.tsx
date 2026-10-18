"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Lock, Layers, BookOpen, X, LogIn, Sparkles } from 'lucide-react';
import PublicHeader from '@/components/layout/PublicHeader';
import Footer from '@/components/layout/Footer';
import { CollectionListItem, fetchCollections } from '@/lib/collection/fetcher';

export default function CollectionsPage() {
  const [collections, setCollections] = useState<CollectionListItem[] | null>(null); // null = loading
  const [error, setError] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [targetSlug, setTargetSlug] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    // Check login status
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (alive && json.success && json.data) {
          setIsLoggedIn(true);
        }
      })
      .catch(() => {});

    // Fetch collections
    fetchCollections()
      .then((data) => alive && setCollections(data))
      .catch(() => alive && setError(true));

    return () => {
      alive = false;
    };
  }, []);

  const handleCollectionClick = (e: React.MouseEvent, slug: string) => {
    if (!isLoggedIn) {
      e.preventDefault();
      setTargetSlug(slug);
      setShowLoginModal(true);
    }
  };

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
                  <Link
                    href={`/collections/${book.slug}`}
                    onClick={(e) => handleCollectionClick(e, book.slug)}
                    className="group relative block aspect-[16/10] w-full overflow-hidden bg-stone-100 cursor-pointer"
                  >
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
                        <Link
                          href={`/collections/${book.slug}`}
                          onClick={(e) => handleCollectionClick(e, book.slug)}
                          className="hover:underline cursor-pointer"
                        >
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
                        onClick={(e) => handleCollectionClick(e, book.slug)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#831843] hover:underline cursor-pointer"
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

      {/* Login Required Popup Modal */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 text-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#831843] mb-4 shadow-sm">
              <Lock className="w-7 h-7" />
            </div>

            <span className="text-[11px] uppercase font-bold tracking-[0.2em] text-[#831843] block mb-1">
              Member Exclusive
            </span>

            <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">
              Whole Seller Login Required
            </h2>

            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-6">
              Our curated seasonal lookbooks and wholesale pricing are reserved exclusively for registered whole sellers. Please log in to view this collection.
            </p>

            <div className="flex flex-col gap-2.5">
              <Link
                href={`/login${targetSlug ? `?next=${encodeURIComponent(`/collections/${targetSlug}`)}` : ''}`}
                className="w-full py-3 px-4 rounded-xl bg-[#1a1a1a] hover:bg-black text-white text-xs font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <LogIn className="w-4 h-4 text-amber-400" />
                Log In to Continue
              </Link>

              <Link
                href="/register"
                className="w-full py-2.5 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold tracking-wide flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Apply for Wholesale Access
              </Link>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}