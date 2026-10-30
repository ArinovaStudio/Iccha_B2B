'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  Download,
  Building2,
  Receipt,
  ShieldCheck,
  CheckCircle,
  FileText
} from 'lucide-react';
import { EstimateDocument } from '@/lib/types';

interface EstimateViewModalProps {
  estimate: EstimateDocument | null;
  onClose: () => void;
}

export default function EstimateViewModal({ estimate, onClose }: EstimateViewModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!estimate || !mounted) return null;

  const handlePrint = () => {
    window.print();
  };

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
      style={{ zIndex: 999999 }} // Forced inline high z-index to bypass Tailwind compiler issues
    >
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto relative">

        {/* Modal Action Bar (Hidden on print) */}
        <div className="no-print p-4 bg-stone-900 text-white rounded-t-3xl flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            <span className="font-serif font-bold text-base">
              Proforma Estimate: <span className="font-mono text-amber-300">{estimate.estimateNumber}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-200 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Estimate Document Body */}
        <div id="printable-estimate" className="p-8 text-stone-900 bg-white text-xs space-y-6">

          {/* Document Header */}
          <div className="border-b-2 border-stone-900 pb-5 flex flex-col sm:flex-row items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#831843] text-white font-serif font-bold flex items-center justify-center text-lg">
                  इ
                </div>
                <div>
                  <h2 className="font-serif text-lg font-bold uppercase tracking-tight text-stone-950">
                    {estimate.billingEntity.legalName}
                  </h2>
                  <div className="text-[11px] font-semibold text-rose-900">
                    {estimate.billingEntity.tradeName}
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-stone-600 max-w-sm mt-1">
                {estimate.billingEntity.registeredAddress}
              </p>
              <div className="text-[11px] font-mono text-stone-700 mt-1">
                GSTIN: <strong>{estimate.billingEntity.gstin}</strong> &bull; State: {estimate.billingEntity.state} ({estimate.billingEntity.stateCode})
              </div>
            </div>

            <div className="text-right sm:self-center bg-stone-50 p-3 rounded-xl border border-stone-200">
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                COMMERCIAL PROFORMA ESTIMATE
              </span>
              <div className="font-mono text-base font-bold text-stone-900 mt-0.5">
                {estimate.estimateNumber}
              </div>
              <div className="text-[11px] text-stone-600 mt-1">
                Date: <strong>{estimate.date}</strong>
              </div>
              <div className="text-[11px] text-stone-600">
                Order Ref: <strong className="font-mono">{estimate.orderNumber}</strong>
              </div>
              <div className="text-[10px] text-emerald-700 font-semibold mt-1">
                Valid Until: {estimate.validUntil}
              </div>
            </div>
          </div>

          {/* Billed To / Whole Seller Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                Whole Seller (Billed To):
              </span>
              <div className="font-bold text-sm text-stone-950">
                {estimate.retailer.businessName}
              </div>
              <div className="text-[11px] text-stone-600">
                Attn: {estimate.retailer.applicantName} ({estimate.retailer.mobile})
              </div>
              <div className="text-[11px] font-mono text-stone-800 font-medium mt-0.5">
                GSTIN: <strong>{estimate.retailer.gstin}</strong>
              </div>
              <div className="text-[11px] text-stone-600 mt-0.5">
                {estimate.retailer.billingAddress.street}, {estimate.retailer.billingAddress.city}, {estimate.retailer.billingAddress.state} - {estimate.retailer.billingAddress.pincode}
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                Consignee (Shipping Address):
              </span>
              <div className="font-semibold text-stone-900 text-xs">
                {estimate.retailer.businessName}
              </div>
              <div className="text-[11px] text-stone-600 mt-0.5">
                {estimate.retailer.shippingAddress.street}, {estimate.retailer.shippingAddress.city}, {estimate.retailer.shippingAddress.state} - {estimate.retailer.shippingAddress.pincode}
              </div>
              <div className="mt-2 text-[10px] bg-white p-1.5 rounded border border-stone-200 inline-block text-stone-600">
                Place of Supply: <strong>{estimate.retailer.shippingAddress.state} (Code {estimate.retailer.shippingAddress.stateCode})</strong>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left border border-stone-300">
              <thead>
                <tr className="bg-stone-100 text-stone-800 border-b border-stone-300 text-[11px]">
                  <th className="p-2.5 font-bold border-r border-stone-300 text-center">#</th>
                  <th className="p-2.5 font-bold border-r border-stone-300">Design / Description</th>
                  <th className="p-2.5 font-bold border-r border-stone-300 text-center">HSN</th>
                  <th className="p-2.5 font-bold border-r border-stone-300 text-center">Sets</th>
                  <th className="p-2.5 font-bold border-r border-stone-300 text-center">Pcs/Set</th>
                  <th className="p-2.5 font-bold border-r border-stone-300 text-center">Total Pcs</th>
                  <th className="p-2.5 font-bold border-r border-stone-300 text-right">Piece Rate</th>
                  <th className="p-2.5 font-bold text-right">Taxable Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {estimate.items.map((item, idx) => (
                  <tr key={item.productId} className="text-xs">
                    <td className="p-2.5 border-r border-stone-200 text-center text-stone-500">{idx + 1}</td>
                    <td className="p-2.5 border-r border-stone-200 font-medium">
                      <div className="font-semibold text-stone-900">{item.productName}</div>
                      <div className="text-[10px] text-stone-500 font-mono">
                        SKU: {item.sku} &bull; Design: {item.designNumber} &bull; Size: {item.sizeCombination}
                      </div>
                    </td>
                    <td className="p-2.5 border-r border-stone-200 text-center font-mono text-[11px] text-stone-600">{item.hsn}</td>
                    <td className="p-2.5 border-r border-stone-200 text-center font-bold">{item.sets}</td>
                    <td className="p-2.5 border-r border-stone-200 text-center">{item.piecesPerSet}</td>
                    <td className="p-2.5 border-r border-stone-200 text-center font-semibold">{item.totalPieces}</td>
                    <td className="p-2.5 border-r border-stone-200 text-right font-mono">₹{item.pieceRate}</td>
                    <td className="p-2.5 text-right font-bold font-mono">₹{item.lineSubtotal.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tax & Grand Total Computation */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">

            {/* Bank Details */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1.5 flex-1 max-w-sm">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">
                Direct Bank Transfer (RTGS / NEFT / IMPS):
              </span>
              <div>Bank Name: <strong>{estimate.billingEntity.bankDetails.bankName}</strong></div>
              <div>A/C Name: <strong>{estimate.billingEntity.bankDetails.accountHolder}</strong></div>
              <div>A/C Number: <strong className="font-mono text-stone-950">{estimate.billingEntity.bankDetails.accountNumber}</strong></div>
              <div>IFSC Code: <strong className="font-mono text-stone-950">{estimate.billingEntity.bankDetails.ifsc}</strong></div>
              <div>Branch: {estimate.billingEntity.bankDetails.branch}</div>
            </div>

            {/* Calculations Table */}
            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-stone-200">
                <span className="text-stone-600">Total Sets / Pieces:</span>
                <span className="font-bold">{estimate.totalSets} Sets ({estimate.totalPieces} pcs)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200">
                <span className="text-stone-600">Taxable Value:</span>
                <span className="font-mono font-bold">₹{estimate.taxableSubtotal.toLocaleString('en-IN')}</span>
              </div>

              {estimate.isInterState ? (
                <div className="flex justify-between py-1 border-b border-stone-200 text-stone-700">
                  <span>Integrated GST (IGST 5.0%):</span>
                  <span className="font-mono">₹{estimate.igstAmount.toLocaleString('en-IN')}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between py-1 border-b border-stone-200 text-stone-700">
                    <span>Central GST (CGST 2.5%):</span>
                    <span className="font-mono">₹{estimate.cgstAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-200 text-stone-700">
                    <span>State GST (SGST 2.5%):</span>
                    <span className="font-mono">₹{estimate.sgstAmount.toLocaleString('en-IN')}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between items-center py-2 border-b border-stone-200 text-stone-600">
                <span className="font-medium">Shipping:</span>
                <span className="text-right text-[11px] font-semibold text-amber-700">
                  Shipping charges will be applied separately
                </span>
              </div>

              <div className="flex justify-between py-2 bg-stone-100 px-3 rounded-lg text-stone-950 font-bold text-sm">
                <span>Grand Estimate Total:</span>
                <span className="font-mono text-rose-900">₹{estimate.grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="pt-4 border-t border-stone-200 space-y-1 text-[10px] text-stone-500">
            <strong className="text-stone-700 uppercase tracking-wider block">Commercial Terms:</strong>
            <ul className="list-disc pl-4 space-y-0.5">
              {estimate.paymentTerms.map((term, i) => (
                <li key={i}>{term}</li>
              ))}
            </ul>
          </div>

          {/* Authorized Signature Box */}
          <div className="pt-6 flex justify-between items-end text-xs text-stone-600">
            <div>
              <p>Generated electronically via IcchaStore B2B System.</p>
            </div>
            <div className="text-right">
              <div className="w-36 border-b border-stone-400 mb-1" />
              <p className="font-semibold text-stone-800">For {estimate.billingEntity.legalName}</p>
              <p className="text-[10px] text-stone-500">Authorized Wholesale Signatory</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}