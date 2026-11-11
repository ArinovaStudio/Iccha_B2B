'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Boxes, 
  Search, 
  Building2, 
  Plus, 
  Minus, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { ProductService } from '@/lib/services';
import { Product } from '@/lib/types';
import { useApp } from '@/lib/context/AppContext';

export default function AdminInventoryPage() {
  const { addToast } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');

  useEffect(() => {
    let isMounted = true;
    const runLoad = async () => {
      const data = await ProductService.getProducts();
      if (isMounted) {
        setProducts(data);
        setLoading(false);
      }
    };
    runLoad();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAdjustStock = async (productId: string, delta: number) => {
    const p = products.find(prod => prod.id === productId);
    if (!p) return;

    const newSets = Math.max(0, p.availableSets + delta);
    await ProductService.updateProduct(productId, { availableSets: newSets });
    
    setProducts(prev => prev.map(prod => prod.id === productId ? { ...prod, availableSets: newSets } : prod));

    addToast({
      type: 'info',
      title: 'Stock Lot Adjusted',
      message: `${p.name} updated to ${newSets} sets (${newSets * p.piecesPerSet} pcs).`
    });
  };

  const filtered = products.filter(p => {
    if (entityFilter !== 'all' && p.billingEntityId !== entityFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.designNumber ?? '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalSuratSets = products.filter(p => p.billingEntityId === 'entity_a').reduce((acc, p) => acc + p.availableSets, 0);
  const totalJaipurSets = products.filter(p => p.billingEntityId === 'entity_b').reduce((acc, p) => acc + p.availableSets, 0);

  return (
    <div className="flex min-h-screen bg-[#faf8f5]">
      <AdminSidebar activeTab="inventory" />

      <main className="flex-1 p-6 lg:p-10 space-y-6 overflow-y-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-[#831843]">
              Warehouse & Stock Lots
            </span>
            <h1 className="font-serif text-3xl font-bold text-stone-900 mt-1">
              Multi-Hub Inventory Matrix
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Live set balances across Surat Silk Division and Jaipur Handblock Unit.
            </p>
          </div>
        </div>

        {/* Hub Stock Summary Banners */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
          <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-100 text-[#831843]">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <strong className="text-stone-900 text-sm block">Surat Manufacturing Hub (Entity A)</strong>
                <span className="text-stone-500">Chanderi, Velvet & Festive Jacquard Lots</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold font-mono text-[#831843]">{totalSuratSets}</span>
              <span className="text-stone-500 text-[10px] block">Sets in Stock</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-100 text-[#9a3412]">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <strong className="text-stone-900 text-sm block">Jaipur Handblock Hub (Entity B)</strong>
                <span className="text-stone-500">Cambric 60x60, Muslin & Bagru Print Lots</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold font-mono text-[#9a3412]">{totalJaipurSets}</span>
              <span className="text-stone-500 text-[10px] block">Sets in Stock</span>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search inventory by Design, SKU or Design Number..."
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-rose-900"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setEntityFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                entityFilter === 'all' ? 'bg-[#831843] text-white shadow' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              All Hubs
            </button>
            <button
              onClick={() => setEntityFilter('entity_a')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                entityFilter === 'entity_a' ? 'bg-[#831843] text-white shadow' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Surat Hub (GST A)
            </button>
            <button
              onClick={() => setEntityFilter('entity_b')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                entityFilter === 'entity_b' ? 'bg-[#9a3412] text-white shadow' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Jaipur Hub (GST B)
            </button>
          </div>
        </div>

        {/* Inventory Table */}
        {loading ? (
          <div className="p-16 bg-white rounded-3xl border border-stone-200 text-center text-xs text-stone-500">
            Loading inventory matrix...
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-4">Kurti Design</th>
                    <th className="p-4">SKU / Design #</th>
                    <th className="p-4">Manufacturing Hub</th>
                    <th className="p-4">Pieces / Set</th>
                    <th className="p-4">Available Sets</th>
                    <th className="p-4 text-right">Live Stock Adjustment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700 font-medium">
                  {filtered.map((p) => {
                    const isSurat = p.billingEntityId === 'entity_a';
                    return (
                      <tr key={p.id} className="hover:bg-stone-50/80 transition">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-14 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                              <Image
                                src={p.media[0]?.url || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800'}
                                alt={p.name}
                                fill
                                className="object-cover object-top"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div>
                              <strong className="text-stone-900 block font-serif text-sm">{p.name}</strong>
                              <span className="text-[11px] text-stone-500">{p.fabric} &bull; {p.workType}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="font-mono font-bold text-stone-900">{p.sku}</span>
                          {p.designNumber && <span className="text-[10px] text-stone-400 block">#{p.designNumber}</span>}
                        </td>

                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold text-white uppercase inline-flex items-center gap-1 ${
                            isSurat ? 'bg-[#831843]' : 'bg-[#9a3412]'
                          }`}>
                            <Building2 className="w-3 h-3" />
                            {isSurat ? 'Surat (A)' : 'Jaipur (B)'}
                          </span>
                        </td>

                        <td className="p-4 font-mono font-bold">
                          {p.piecesPerSet} pcs <span className="text-stone-400 font-sans font-normal">({p.sizeCombination})</span>
                        </td>

                        <td className="p-4">
                          <span className={`font-mono font-bold px-2.5 py-1 rounded text-xs inline-flex items-center gap-1 ${
                            p.availableSets <= 8 ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                          }`}>
                            {p.availableSets <= 8 && <AlertTriangle className="w-3 h-3 text-amber-700" />}
                            {p.availableSets} Sets ({p.availableSets * p.piecesPerSet} pcs)
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <div className="inline-flex items-center gap-1 border border-stone-200 rounded-xl bg-stone-50 overflow-hidden p-0.5">
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(p.id, -5)}
                              className="px-2 py-1 hover:bg-stone-200 text-stone-700 rounded font-mono font-bold"
                              title="Deduct 5 sets"
                            >
                              -5
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(p.id, -1)}
                              className="p-1 hover:bg-stone-200 text-stone-700 rounded"
                              title="Deduct 1 set"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2 font-mono font-bold text-stone-900 min-w-[30px] text-center">
                              {p.availableSets}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(p.id, 1)}
                              className="p-1 hover:bg-stone-200 text-stone-700 rounded"
                              title="Add 1 set"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(p.id, 5)}
                              className="px-2 py-1 hover:bg-stone-200 text-stone-700 rounded font-mono font-bold"
                              title="Add 5 sets"
                            >
                              +5
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
