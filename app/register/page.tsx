'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  UserCheck, 
  Phone, 
  MapPin, 
  Lock,
  AlertTriangle
} from 'lucide-react';
import PublicHeader from '@/components/layout/PublicHeader';
import Footer from '@/components/layout/Footer';
import { useApp } from '@/lib/context/AppContext';

export default function RegisterStep1Page() {
  const router = useRouter();
  const { addToast } = useApp();

  const [formData, setFormData] = useState({
    accountType: 'retailer' as 'retailer' | 'drop_shipper',
    businessName: '',
    applicantName: '',
    mobile: '',
    whatsapp: '',
    email: '',
    street: '',
    city: '',
    state: 'Rajasthan',
    stateCode: '08',
    pincode: ''
  });

  const stateCodes: Record<string, string> = {
    'Gujarat': '24',
    'Rajasthan': '08',
    'Maharashtra': '27',
    'Delhi': '07',
    'Karnataka': '29',
    'Uttar Pradesh': '09',
    'Madhya Pradesh': '23',
    'Tamil Nadu': '33',
    'Telangana': '36',
    'West Bengal': '19',
    'Punjab': '03',
    'Haryana': '06'
  };

  const handleStateChange = (selectedState: string) => {
    setFormData({
      ...formData,
      state: selectedState,
      stateCode: stateCodes[selectedState] || '99'
    });
  };

  const handleFillDemoData = () => {
    setFormData(prev => ({
      ...prev,
      businessName: 'Ananya Designer Boutiques',
      applicantName: 'Ananya Rathore',
      mobile: '+91 94140 77665',
      whatsapp: '+91 94140 77665',
      email: 'ananya.rathore@boutique.in',
      street: 'Shop 14-15, Royal Heritage Arcade, MI Road',
      city: 'Jaipur',
      state: 'Rajasthan',
      stateCode: '08',
      pincode: '302001'
    }));

    addToast({
      type: 'info',
      title: 'Demo Data Loaded',
      message: 'Verified boutique details loaded for rapid onboarding testing.'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save Step 1 state to session/local storage for Step 2
    if (typeof window !== 'undefined') {
      localStorage.setItem('iccha_kyc_step1', JSON.stringify(formData));
    }
    router.push('/register/kyc');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <PublicHeader />

      <main className="flex-1 py-12 bg-[#faf8f5]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Multi-step progress header */}
          <div className="mb-8 space-y-4 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#831843] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Retailer Onboarding Portal
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
              Apply for B2B Retailer Account
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto">
              Step 1 of 2: Register your garment boutique or retail store to unlock direct factory pricing and live inventory.
            </p>

            {/* Stepper indicator */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#831843]">
                <span className="w-6 h-6 rounded-full bg-[#831843] text-white flex items-center justify-center text-xs">
                  1
                </span>
                <span>Business Profile</span>
              </div>
              <div className="w-12 h-0.5 bg-stone-300" />
              <div className="flex items-center gap-2 text-xs font-semibold text-stone-400">
                <span className="w-6 h-6 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center text-xs">
                  2
                </span>
                <span>KYC & GST Documents</span>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-sm space-y-6">
            
            {/* Inactivity Warning Notice */}
            <div className="p-3.5 bg-red-50 rounded-2xl border border-red-200 flex items-start gap-3 text-xs">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-red-900">
                <span className="font-bold">Account Activity Notice: </span>
                <span>
                  Retailer accounts that remain inactive for an extended period of more then 15 days (no logins or orders)
                  may be automatically deactivated. Please log in and place orders periodically to
                  keep your account active.
                  If once your account is deactivated then you will have to contact the admin for reactivation of your account
                </span>
              </div>
            </div>

            {/* Quick Demo Pre-fill Button */}
            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-amber-900 font-medium">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <span>Testing the onboarding flow? Load sample boutique information in one click.</span>
              </div>
              <button
                type="button"
                onClick={handleFillDemoData}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold whitespace-nowrap transition shadow-sm"
              >
                Pre-fill Demo Boutique
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 text-xs">

              {/* Account Type Selection */}
              <div className="space-y-3">
                <h3 className="font-serif text-base font-bold text-stone-900 border-b border-stone-100 pb-2">
                  Account Type
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                      formData.accountType === 'retailer'
                        ? 'border-[#831843] bg-rose-50'
                        : 'border-stone-200 bg-stone-50 hover:border-stone-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="accountType"
                      value="retailer"
                      checked={formData.accountType === 'retailer'}
                      onChange={() => setFormData({ ...formData, accountType: 'retailer' })}
                      className="sr-only"
                    />
                    <span className="font-bold text-stone-900 block">Retailer / Boutique</span>
                    <span className="text-[11px] text-stone-500 block mt-1">
                      You hold and sell stock directly. GSTIN required.
                    </span>
                  </label>

                  <label
                    className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                      formData.accountType === 'drop_shipper'
                        ? 'border-[#831843] bg-rose-50'
                        : 'border-stone-200 bg-stone-50 hover:border-stone-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="accountType"
                      value="drop_shipper"
                      checked={formData.accountType === 'drop_shipper'}
                      onChange={() => setFormData({ ...formData, accountType: 'drop_shipper' })}
                      className="sr-only"
                    />
                    <span className="font-bold text-stone-900 block">Drop Shipper</span>
                    <span className="text-[11px] text-stone-500 block mt-1">
                      You resell without holding inventory. GSTIN not required.
                    </span>
                  </label>
                </div>
              </div>

              {/* Business Entity details */}
              <div className="space-y-4">
                <h3 className="font-serif text-base font-bold text-stone-900 border-b border-stone-100 pb-2">
                  1. Business Identity
                </h3>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block font-semibold text-stone-800 mb-1">
                      Registered Business / Boutique Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.businessName}
                      onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                      placeholder="e.g. Saffron Styles & Boutiques"
                      className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-900 font-medium"
                    />
                  </div>

                </div>
              </div>

              {/* Applicant Contact details */}
              <div className="space-y-4">
                <h3 className="font-serif text-base font-bold text-stone-900 border-b border-stone-100 pb-2">
                  2. Authorized Buyer / Applicant
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-stone-800 mb-1">
                      Applicant Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.applicantName}
                      onChange={e => setFormData({ ...formData, applicantName: e.target.value })}
                      placeholder="e.g. Ramesh Chandra Patel"
                      className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-900 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-800 mb-1">
                      Mobile Number (for SMS & OTP Login) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.mobile}
                      onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                      placeholder="+91 98250 12345"
                      className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-900 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-800 mb-1">
                      WhatsApp Number (for Video Call Samples) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.whatsapp}
                      onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                      placeholder="+91 98250 12345"
                      className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-900 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-800 mb-1">
                      Official Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="orders@yourboutique.com"
                      className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-900 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Business Address */}
              <div className="space-y-4">
                <h3 className="font-serif text-base font-bold text-stone-900 border-b border-stone-100 pb-2">
                  3. Store / Registered Dispatch Address
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block font-semibold text-stone-800 mb-1">
                      Premises Address / Shop Number / Street *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.street}
                      onChange={e => setFormData({ ...formData, street: e.target.value })}
                      placeholder="e.g. Shop 12, First Floor, City Centre Market"
                      className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-900 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold text-stone-800 mb-1">
                        City / Town *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                        placeholder="e.g. Jaipur"
                        className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-900 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-800 mb-1">
                        State (for GST Place of Supply) *
                      </label>
                      <select
                        value={formData.state}
                        onChange={e => handleStateChange(e.target.value)}
                        className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-900 font-medium"
                      >
                        {Object.keys(stateCodes).map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-800 mb-1">
                        Postal PIN Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.pincode}
                        onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                        placeholder="e.g. 302001"
                        maxLength={6}
                        className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-900 font-medium font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-stone-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Encrypted 256-bit B2B Onboarding</span>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#831843] to-[#9a3412] hover:from-[#701a75] hover:to-[#852e10] text-white font-bold shadow-lg transition flex items-center justify-center gap-2"
                >
                  <span>Proceed to Step 2: KYC & GST Upload</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </form>

          </div>

          {/* Already registered quick login link */}
          <div className="text-center mt-6 text-xs text-stone-600">
            Already applied?{' '}
            <Link href="/application-status" className="font-bold text-[#831843] hover:underline">
              Check KYC Application Status &rarr;
            </Link>
            <span className="mx-2">&bull;</span>
            <Link href="/login" className="font-bold text-stone-900 hover:underline">
              Retailer Login
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}