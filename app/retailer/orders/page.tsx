'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, 
  Receipt, 
  Clock, 
  CheckCircle2, 
  Truck, 
  Building2, 
  ArrowRight, 
  Eye, 
  Printer, 
  FileText,
  Search
} from 'lucide-react';
import RetailerHeader from '@/components/layout/RetailerHeader';
import Footer from '@/components/layout/Footer';
import EstimateViewModal from '@/components/order/EstimateViewModal';
import { useApp } from '@/lib/context/AppContext';

export default function RetailerOrdersPage() {
  const { currentRetailer } = useApp();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEstimate, setSelectedEstimate] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/retailer/order-enquiries', {
          method: 'GET',
          cache: 'no-store',
        });

        const json = await response.json();

        if (!response.ok || !json.success) {
          throw new Error(json.error || 'Could not load order enquiries.');
        }

        if (!cancelled) {
          setOrders(json.data || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load order enquiries.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredOrders = orders.filter(o => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'proforma_generated') {
      return (o.estimates || []).length > 0;
    }
    return o.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'enquiry_received':
        return <span className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full text-[10px] font-bold">Enquiry Received</span>;
      case 'under_review':
        return <span className="bg-blue-100 text-blue-900 px-2.5 py-1 rounded-full text-[10px] font-bold">Under Review</span>;
      case 'seller_contacted':
        return <span className="bg-indigo-100 text-indigo-900 px-2.5 py-1 rounded-full text-[10px] font-bold">Seller Contacted</span>;
      case 'estimate_generated':
        return <span className="bg-sky-100 text-sky-900 px-2.5 py-1 rounded-full text-[10px] font-bold">Proforma Ready</span>;
      case 'confirmed':
      case 'awaiting_payment':
        return <span className="bg-purple-100 text-purple-900 px-2.5 py-1 rounded-full text-[10px] font-bold">Awaiting Payment</span>;
      case 'processing':
      case 'ready_for_dispatch':
        return <span className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full text-[10px] font-bold">Ready for Dispatch</span>;
      case 'dispatched':
        return <span className="bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1"><Truck className="w-3 h-3" /> Dispatched</span>;
      case 'completed':
        return <span className="bg-emerald-200 text-emerald-950 px-2.5 py-1 rounded-full text-[10px] font-bold">Completed</span>;
      case 'cancelled':
        return <span className="bg-rose-100 text-rose-900 px-2.5 py-1 rounded-full text-[10px] font-bold">Cancelled</span>;
      default:
        return <span className="bg-stone-100 text-stone-800 px-2.5 py-1 rounded-full text-[10px] font-bold">Active</span>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <RetailerHeader />

      <main className="flex-1 py-8 bg-[#faf8f5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          
          {/* Breadcrumbs & Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <nav className="text-xs text-stone-500 mb-1 flex items-center gap-2">
                <Link href="/retailer" className="hover:text-stone-900">Whole seller Portal</Link>
                <span>/</span>
                <span className="text-stone-900 font-semibold">Order Enquiries</span>
              </nav>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                Master Order Enquiries & Estimates
              </h1>
            </div>

            <Link
              href="/catalogue"
              className="px-4 py-2 bg-[#831843] text-white text-xs font-bold rounded-xl shadow hover:bg-rose-900 transition flex items-center gap-1.5 self-start sm:self-center"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Create New Order</span>
            </Link>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap gap-2 text-xs bg-white p-2 rounded-2xl border border-stone-200 shadow-sm">
            {[
              { id: 'all', label: 'All Enquiries' },
              { id: 'enquiry_received', label: 'Enquiry Received' },
              { id: 'proforma_generated', label: 'Proforma Ready' },
              { id: 'dispatched', label: 'Dispatched' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                  statusFilter === tab.id
                    ? 'bg-[#831843] text-white shadow'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Orders List */}
          {loading ? (
            <div className="p-16 bg-white rounded-3xl border border-stone-200 text-center text-xs text-stone-500">
              Loading orders...
            </div>
          ) : error ? (
            <div className="p-10 bg-white rounded-3xl border border-rose-200 text-center space-y-3">
              <Receipt className="w-10 h-10 text-rose-300 mx-auto" />
              <h3 className="font-serif text-lg font-bold text-stone-800">Could not load order enquiries</h3>
              <p className="text-xs text-rose-700">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-[#831843] text-white text-xs font-bold rounded-xl"
              >
                Try Again
              </button>
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm hover:shadow-md transition space-y-4"
                >
                  {/* Order Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-serif text-lg font-bold text-stone-900">
                          Order #{order.orderNumber}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="text-xs text-stone-500 mt-0.5">
                        Placed on: <strong>{order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN') : '—'}</strong> &bull; Total Volume: <strong>{order.totalSets} Sets ({order.totalPieces} Pieces)</strong>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">Grand Total</span>
                      <span className="text-lg font-bold font-mono text-stone-900">
                        ₹{(order.masterTotal || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Dual Entity Proforma Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {(order.estimates || []).map((est: any) => {
                      const isPlatform = est.billingEntity?.code === 'platform';
                      return (
                        <div
                          key={est.id}
                          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                            'bg-stone-50 border-stone-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl text-white bg-[#831843]">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <strong className="text-stone-900 block">
                                {isPlatform ? 'IcchaStore' : (est.billingEntity?.tradeName || est.billingEntity?.legalName || 'Vendor')}
                              </strong>
                              <span className="text-[10px] text-stone-600 font-mono">
                                Proforma: #{est.estimateNumber} &bull; ₹{Number(est.grandTotal || 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedEstimate(est)}
                            className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-800 rounded-lg font-bold text-[11px] border border-stone-200 shadow-sm transition flex items-center gap-1"
                          >
                            <Printer className="w-3 h-3 text-stone-600" />
                            <span>View / Print</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Action Link to Full Timeline */}
                  <div className="pt-2 flex items-center justify-between text-xs">
                    <div className="text-stone-500">
                      Transport: <strong>{order.customerRemarks?.slice(0, 50) || 'Standard Road Express'}</strong>
                    </div>

                    <Link
                      href={`/retailer/orders/${order.id}`}
                      className="text-xs font-bold text-[#831843] hover:underline flex items-center gap-1"
                    >
                      <span>Full Order Timeline & Consignment Dispatch</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 bg-white rounded-3xl border border-stone-200 text-center space-y-3">
              <Receipt className="w-12 h-12 text-stone-300 mx-auto" />
              <h3 className="font-serif text-lg font-bold text-stone-800">No order enquiries found</h3>
              <p className="text-xs text-stone-500">Create your first wholesale kurti order enquiry from our catalogue.</p>
              <Link
                href="/catalogue"
                className="px-5 py-2.5 bg-[#831843] text-white text-xs font-bold rounded-xl inline-block"
              >
                Browse Catalogue
              </Link>
            </div>
          )}

        </div>
      </main>

      {/* Proforma View & Print Modal */}
      <EstimateViewModal
        estimate={selectedEstimate}
        onClose={() => setSelectedEstimate(null)}
      />

      <Footer />
    </div>
  );
}
