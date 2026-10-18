'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Receipt,
  Printer,
  Building2,
} from 'lucide-react';
import RetailerHeader from '@/components/layout/RetailerHeader';
import Footer from '@/components/layout/Footer';
import EstimateViewModal from '@/components/order/EstimateViewModal';
import { EstimateDocument, BillingEntity, OrderItem, Address } from '@/lib/types';

export default function RetailerEstimatesPage() {
  const [estimates, setEstimates] = useState<EstimateDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEstimate, setSelectedEstimate] = useState<EstimateDocument | null>(null);
  const [sellerFilter, setSellerFilter] = useState<string>('all');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const response = await fetch('/api/retailer/order-enquiries', {
          method: 'GET',
          cache: 'no-store',
        });
        const json = await response.json();

        if (!response.ok || !json.success) {
          throw new Error(json.error || 'Could not load proforma estimates.');
        }

        const mapped: EstimateDocument[] = (json.data || []).flatMap((order: any) =>
          (order.estimates || []).map((estimate: any) => {
            const rawBilling = estimate.billingEntity;
            const billingEntity: BillingEntity = {
              id: rawBilling.id,
              code: rawBilling.code,
              legalName: rawBilling.legalName,
              tradeName: rawBilling.tradeName || rawBilling.legalName,
              gstin: rawBilling.gstin,
              pan: rawBilling.pan || '',
              registeredAddress: rawBilling.registeredAddress,
              state: rawBilling.state,
              stateCode: rawBilling.stateCode,
              contactEmail: rawBilling.contactEmail || '',
              contactPhone: rawBilling.contactPhone || '',
              bankDetails: {
                bankName: rawBilling.bankName || '',
                accountNumber: rawBilling.accountNumber || '',
                accountHolder: rawBilling.accountHolder || '',
                ifsc: rawBilling.ifsc || '',
                branch: rawBilling.branch || '',
                upiId: rawBilling.upiId || undefined,
              },
              estimatePrefix: rawBilling.estimatePrefix || '',
              invoicePrefix: rawBilling.invoicePrefix || '',
              assignedCategoryIds: [],
              taxConfig: {
                cgstRate: estimate.isInterState ? 0 : Number(estimate.totalGst || 0) > 0 && Number(estimate.taxableSubtotal || 0) > 0 ? Number(estimate.totalGst) / Number(estimate.taxableSubtotal) * 50 : 0,
                sgstRate: estimate.isInterState ? 0 : Number(estimate.totalGst || 0) > 0 && Number(estimate.taxableSubtotal || 0) > 0 ? Number(estimate.totalGst) / Number(estimate.taxableSubtotal) * 50 : 0,
                igstRate: estimate.isInterState ? (Number(estimate.totalGst || 0) > 0 && Number(estimate.taxableSubtotal || 0) > 0 ? Number(estimate.totalGst) / Number(estimate.taxableSubtotal) * 100 : 0) : 0,
                defaultGstRate: Number(rawBilling.defaultGstRate || 0),
              },
            };

            const items: OrderItem[] = (order.items || [])
              .filter((item: any) => item.billingEntityId === estimate.billingEntityId)
              .map((item: any) => ({
                ...item,
                imageUrl: item.imageUrl || '',
                color: item.color || 'Assorted',
                sizeCombination: item.sizeCombination || 'Assorted',
                pieceRate: Number(item.pieceRate || 0),
                setRate: Number(item.setRate || 0),
                lineSubtotal: Number(item.lineSubtotal || 0),
                gstRate: Number(item.gstRate || 0),
                gstAmount: Number(item.gstAmount || 0),
                totalWithGst: Number(item.totalWithGst || 0),
              }));

            const fallbackAddress: Address = {
              street: '', city: '', state: '', stateCode: '', pincode: ''
            };

            return {
              id: estimate.id,
              estimateNumber: estimate.estimateNumber,
              orderId: estimate.orderId,
              orderNumber: estimate.orderNumber,
              date: estimate.date,
              validUntil: estimate.validUntil,
              billingEntity,
              retailer: {
                id: order.retailerId || '',
                businessName: order.retailerBusinessName || '',
                applicantName: order.retailerApplicantName || '',
                gstin: order.retailerGstin || '',
                pan: '',
                mobile: order.retailerContact || '',
                email: order.retailerEmail || '',
                billingAddress: order.billingAddress || fallbackAddress,
                shippingAddress: order.shippingAddress || fallbackAddress,
              },
              items,
              totalSets: estimate.totalSets,
              totalPieces: estimate.totalPieces,
              taxableSubtotal: Number(estimate.taxableSubtotal || 0),
              isInterState: Boolean(estimate.isInterState),
              cgstAmount: Number(estimate.cgstAmount || 0),
              sgstAmount: Number(estimate.sgstAmount || 0),
              igstAmount: Number(estimate.igstAmount || 0),
              totalGst: Number(estimate.totalGst || 0),
              shippingCharge: Number(estimate.shippingCharge || 0),
              grandTotal: Number(estimate.grandTotal || 0),
              paymentTerms: [],
            } as EstimateDocument;
          })
        );

        if (!cancelled) setEstimates(mapped);
      } catch (err) {
        console.error('Load estimates failed:', err);
        if (!cancelled) setEstimates([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const sellerOptions = Array.from(
    new Map(
      estimates.map((estimate) => [estimate.billingEntity.id, estimate.billingEntity])
    ).values()
  );

  const filteredEstimates = estimates.filter(e => {
    if (sellerFilter !== 'all' && e.billingEntity?.id !== sellerFilter) return false;
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen">
      <RetailerHeader />

      <main className="flex-1 py-8 bg-[#faf8f5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

          {/* Breadcrumbs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <nav className="text-xs text-stone-500 mb-1 flex items-center gap-2">
                <Link href="/retailer" className="hover:text-stone-900">Whole Seller Portal</Link>
                <span>/</span>
                <span className="text-stone-900 font-semibold">Proforma Estimates</span>
              </nav>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                GST Proforma Invoices & Estimates
              </h1>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSellerFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${sellerFilter === 'all' ? 'bg-[#831843] text-white' : 'bg-white border border-stone-200 text-stone-700'
                  }`}
              >
                All Sellers
              </button>
              {sellerOptions.map((seller) => (
                <button
                  key={seller.id}
                  onClick={() => setSellerFilter(seller.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${sellerFilter === seller.id ? 'bg-[#831843] text-white' : 'bg-white border border-stone-200 text-stone-700'
                    }`}
                >
                  {seller.code === 'platform' ? 'IcchaStore' : seller.tradeName || seller.legalName}
                </button>
              ))}
            </div>
          </div>

          {/* Estimates Table / Cards */}
          {loading ? (
            <div className="p-16 bg-white rounded-3xl border border-stone-200 text-center text-xs text-stone-500">
              Loading proforma estimates...
            </div>
          ) : filteredEstimates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredEstimates.map((est) => {
                const isPlatform = est.billingEntity?.code === 'platform';
                return (
                  <div
                    key={est.id}
                    className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm hover:shadow-md transition space-y-4 text-xs flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase text-white flex items-center gap-1 ${'bg-[#831843]'
                          }`}>
                          <Building2 className="w-3 h-3" />
                          {isPlatform ? 'IcchaStore' : 'Vendor'}
                        </span>
                      </div>

                      <div>
                        <strong className="text-stone-900 text-sm block">{est.billingEntity?.legalName}</strong>
                        <span className="text-[11px] text-stone-500 font-mono">
                          GSTIN: {est.billingEntity?.gstin}
                        </span>
                      </div>

                      <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100 space-y-1 text-stone-600">
                        <div className="flex justify-between">
                          <span>Items Included:</span>
                          <strong className="text-stone-900">{est.items.length} Product Lots</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Taxable Value:</span>
                          <span className="font-mono">₹{est.taxableSubtotal.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>GST (5%):</span>
                          <span className="font-mono">₹{est.totalGst.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between font-bold text-stone-900 border-t border-stone-200 pt-1">
                          <span>Proforma Amount:</span>
                          <span className="font-mono text-rose-900 text-sm">
                            ₹{est.grandTotal.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedEstimate(est)}
                      className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow flex items-center justify-center gap-1.5 transition"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-400" />
                      <span>View & Print Proforma</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-16 bg-white rounded-3xl border border-stone-200 text-center space-y-3">
              <Receipt className="w-12 h-12 text-stone-300 mx-auto" />
              <h3 className="font-serif text-lg font-bold text-stone-800">No Proforma Estimates Found</h3>
              <p className="text-xs text-stone-500">Estimates are generated automatically upon order enquiry creation.</p>
            </div>
          )}

        </div>
      </main>

      <EstimateViewModal
        estimate={selectedEstimate}
        onClose={() => setSelectedEstimate(null)}
      />

      <Footer />
    </div>
  );
}
