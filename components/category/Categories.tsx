
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import PublicHeader from '@/components/layout/PublicHeader';
import Footer from '@/components/layout/Footer';
import axios from 'axios';

export default function CategoriesPage() {
const [categories, setCategories] = useState<any[]>([]);
const [categoriesTitle, setCategoriesTitle] = useState<string>('');

const getData = async () => {
  const [categoriesRes, categoriesTitleRes] = await Promise.all([
    axios.get("/api/categories"),
    axios.get("/api/categoriesTitle"),
  ]);

  if (categoriesRes.status === 200) {
    setCategories(categoriesRes.data.categories);
  }

  if (categoriesTitleRes.status === 200) {
    setCategoriesTitle(categoriesTitleRes.data[0].title);
  }
};


useEffect(() => {
  const storageKey = 'categoriesScrollPosition';

  // Fetch categories as before.
  getData();

  // Restore the saved position when returning from a category.
  const navigationEntry = performance.getEntriesByType(
    'navigation'
  )[0] as PerformanceNavigationTiming | undefined;

  const isReturning =
    navigationEntry?.type === 'back_forward' ||
    sessionStorage.getItem('returnToCategories') === 'true';

  if (isReturning) {
    // Always start at the top when returning to Categories.
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });

    sessionStorage.removeItem('returnToCategories');
    sessionStorage.removeItem(storageKey);
  }

}, []);


  return (
    <div className="flex flex-col min-h-screen">
      <PublicHeader />

      <main className="flex-1 bg-[#f7f7f2] py-8 sm:py-10">
        <div className="w-full px-4 sm:px-8 lg:px-[5%] 2xl:px-[10%]">
          {/* Breadcrumbs */}
          <nav className="text-xs text-stone-500 mb-5 flex items-center gap-2">
            <Link href="/" className="hover:text-stone-900">Home</Link>
            <span>/</span>
            <span className="text-stone-900 font-semibold">Categories</span>
          </nav>

          {/* Header Banner */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-[#e5e3dc] shadow-sm mb-6 sm:mb-8">
            <div className="max-w-3xl space-y-2">
              <span className="text-[10px] font-semibold tracking-[0.16em] text-[#9b7b3e] block">
                Wholesale Product Lines
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900 normal-case">
                {categories.length} Categories
              </h1>
              <p className="text-sm text-stone-600 leading-relaxed normal-case">
                {categoriesTitle || 'Explore our diverse range of wholesale product lines, each crafted with care and precision to meet your business needs.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="group relative bg-white rounded-xl border border-[#e5e3dc] hover:border-[#c5b487] hover:shadow-md transition-all duration-200 flex flex-col min-h-[174px]"
              >
                <span className="absolute right-3 top-3 rounded border border-stone-200 bg-[#fafaf7] px-1.5 py-0.5 text-[9px] font-semibold text-stone-600">
                  {category.type === '3_piece' ? '3-Pc Set' : category.type === '2_piece' ? '2-Pc Set' : 'Kurti Lot'}
                </span>

                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <div>
                    <h2 className="pr-10 font-serif text-[21px] leading-tight font-medium text-stone-900 normal-case">
                      {category.name}
                    </h2>
                    <p className="mt-2 w-full text-[11px] leading-relaxed text-stone-600 normal-case line-clamp-3">
                      {category.description || `Wholesale ${category.name} manufactured in-house.`}
                    </p>
                  </div>

                  <div className="mt-2">
                    <span className="inline-flex rounded-full bg-[#f7f3e8] px-2 py-1 text-[9px] font-medium text-[#8a713b] normal-case">
                      {category.itemCount}+ available designs
                    </span>
                  </div>

                  <div className="mt-auto pt-3 border-t border-stone-100 flex items-center">
                    <Link
                      href={`/categories/${category.slug}`}
                      scroll={false}
                      onClick={() => {
                        sessionStorage.setItem(
                          'categoriesScrollPosition',
                          String(window.scrollY)
                        );
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-[#e5dcc6] px-2.5 py-1 text-[9px] font-medium text-[#6d5427] transition hover:border-[#b99a58] hover:bg-[#faf7ef] group-hover:text-stone-900"
                    >
                      <span>Representative Catalogue</span>
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
