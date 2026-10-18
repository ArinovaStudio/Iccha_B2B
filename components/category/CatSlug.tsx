"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowLeft, 
} from 'lucide-react';
import PublicHeader from '@/components/layout/PublicHeader';
import Footer from '@/components/layout/Footer';
import PublicProductCard from '@/components/product/PublicProductCard';

import axios from 'axios';



export default function CategoryDetailPage({ slug }: {slug: string}) {

        const [category, setCategory] = useState<any>({})
        const [products, setProducts] = useState<any[]>([])

          const getData = async () => {
        const req = await axios.get(`/api/categories?slug=${slug}`)
        if (req.status === 200) {
            console.log(req.data.category.products);
            setProducts(req.data.category.products)
          setCategory(req.data.category)
        }
      }

  useEffect(() => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'instant',
  });

  getData();
}, [slug]);

  return (
    <div className="flex flex-col min-h-screen">
      <PublicHeader />

      <main className="flex-1 py-10 bg-[#faf8f5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  
          <nav className="text-xs text-stone-500 mb-6 flex items-center gap-2">
            <Link href="/" className="hover:text-stone-900">Home</Link>
            <span>/</span>
            <Link href="/categories" className="hover:text-stone-900">Categories</Link>
            <span>/</span>
            <span className="text-stone-900 font-semibold">{category.name}</span>
          </nav>

      
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e7dfd5] shadow-sm mb-10 overflow-hidden relative">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              
              <div className="md:col-span-8 space-y-4">
                <h1 className="font-serif text-xl sm:text-4xl font-bold text-stone-900">
                  {category.name}
                </h1>

                <p className="text-sm text-stone-600 leading-relaxed max-w-2xl">
                  {category.description}
                </p>

              </div>

            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xs font-bold text-stone-900">
                Featured Representative Designs ({products.length})
              </h2>
              <Link href="/categories" className="text-xs font-semibold text-rose-900 hover:underline flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> All Categories
              </Link>
            </div>

            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product: any) => (
                  <PublicProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="p-12 bg-white rounded-2xl border border-stone-200 text-center">
                <p className="text-sm text-stone-500">More designs currently in final finishing at our production facility.</p>
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
