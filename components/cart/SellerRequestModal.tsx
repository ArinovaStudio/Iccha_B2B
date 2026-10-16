'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Video, 
  PhoneCall, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Building2, 
  Sparkles, 
  Package 
} from 'lucide-react';
import { useApp } from '@/lib/context/AppContext';

export default function SellerRequestModal() {
  const {
    isSellerModalOpen,
    closeSellerModal,
    cart,
    currentRetailer,
    addToast,
    sellerRequestProductId,
  } = useApp();
  
  const [customerName, setCustomerName] = useState(currentRetailer?.applicantName || 'Ananya Rathore');
  const [businessName, setBusinessName] = useState(currentRetailer?.businessName || 'Ananya Designer Boutiques');
  const [mobile, setMobile] = useState(currentRetailer?.mobile || '+91 94140 77665');
  const [whatsapp, setWhatsapp] = useState(
  currentRetailer?.whatsapp || currentRetailer?.mobile || ''
);
  const [preferredDate, setPreferredDate] = useState('2026-09-03');
  const [preferredTime, setPreferredTime] = useState('2:00 PM - 4:00 PM IST');
  const [remarks, setRemarks] = useState('We would like to inspect the fabric and stitching quality over video call before placing our bulk festive festival order.');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequestNumber, setSubmittedRequestNumber] = useState<string | null>(null);

  const [selectedProductId, setSelectedProductId] =
    useState<string | null>(
      sellerRequestProductId ||
        cart.items[0]?.productId ||
        null
    );

  // Must stay above the early return below (rules of hooks)
  useEffect(() => {
    if (sellerRequestProductId) {
      setSelectedProductId(sellerRequestProductId);
    } else if (
      !selectedProductId &&
      cart.items.length > 0
    ) {
      setSelectedProductId(
        cart.items[0].productId
      );
    }
  }, [
    sellerRequestProductId,
    cart.items,
    selectedProductId,
  ]);

  if (!isSellerModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!selectedProductId) {
        throw new Error(
          'Please select a product for the sample call request.'
        );
      }

      const response = await fetch(
        '/api/retailer/sample-call-requests',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId: selectedProductId,
            customerName,
            businessName,
            mobile,
            whatsapp,
            preferredDate,
            preferredTime,
            remarks,
          }),
        }
      );

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(
          json.error ||
            'Could not submit request.'
        );
      }

      setSubmittedRequestNumber(json.data.id);
      addToast({
        type: 'success',
        title: 'Video Call & Sample Request Submitted',
        message: 'IcchaStore wholesale sales manager will contact you via WhatsApp / Phone.'
      });
    } catch (err) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Submission Failed',
        message: err instanceof Error ? err.message : 'Could not send request. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmittedRequestNumber(null);
    closeSellerModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden">
        
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-stone-900 via-rose-950 to-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold">Contact Seller / Request Video Call</h3>
              <p className="text-xs text-rose-200">Sample Quality Review & MOQ Exception Request</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        {submittedRequestNumber ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h4 className="font-serif text-2xl font-bold text-stone-900">Request Registered!</h4>
            <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
              Your video consultation & sample request <strong className="font-mono text-stone-900 font-bold">#{submittedRequestNumber}</strong> has been logged with IcchaStore management.
            </p>
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-700 text-left space-y-1 max-w-md mx-auto">
              <div><strong>Scheduled Preference:</strong> {preferredDate} at {preferredTime}</div>
              <div><strong>WhatsApp Contact:</strong> {whatsapp}</div>
              <div><strong>Selected Lots:</strong> {cart.totalSets} Sets ({cart.totalPieces} pcs)</div>
            </div>
            <p className="text-[11px] text-stone-500">
              Our representative will connect directly via WhatsApp with HD garment video feeds and dispatch terms.
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-2.5 bg-[#831843] text-white text-xs font-semibold rounded-xl shadow hover:bg-rose-900 transition"
            >
              Done & Return to Cart
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {/* Cart Summary Banner */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-950 font-medium">
                <Package className="w-4 h-4 text-amber-700" />
                <span>Current Cart: <strong>{cart.totalSets} Sets ({cart.totalPieces} pcs)</strong></span>
              </div>
              <div className="text-amber-900 font-bold">
                Value: ₹{cart.subtotal.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Applicant Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-rose-700"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Business / Boutique Name *</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-rose-700"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Calling Mobile *</label>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-rose-700"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">WhatsApp Number (for Video Call) *</label>
                <input
                  type="tel"
                  required
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-rose-700"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Preferred Date *</label>
                <input
                  type="date"
                  required
                  value={preferredDate}
                  onChange={e => setPreferredDate(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-rose-700"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Preferred Time Slot *</label>
                <select
                  value={preferredTime}
                  onChange={e => setPreferredTime(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-rose-700"
                >
                  <option value="11:00 AM - 1:00 PM IST">11:00 AM - 1:00 PM IST (Morning)</option>
                  <option value="2:00 PM - 4:00 PM IST">2:00 PM - 4:00 PM IST (Afternoon)</option>
                  <option value="5:00 PM - 7:00 PM IST">5:00 PM - 7:00 PM IST (Evening)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">Specific Sample Questions / Remarks</label>
              <textarea
                rows={3}
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="Mention specific colors, fabrics, or lot sizes you wish to see on video call..."
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-rose-700"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 font-medium hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#831843] to-[#9a3412] text-white font-semibold shadow hover:from-rose-900 hover:to-amber-900 transition flex items-center gap-1.5"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Video Call Request'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}