'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  FileCheck,
  Trash2,
  Lock
} from 'lucide-react';
import PublicHeader from '@/components/layout/PublicHeader';
import Footer from '@/components/layout/Footer';
import { useApp } from '@/lib/context/AppContext';

interface Step1Data {
  accountType: 'retailer' | 'drop_shipper';
  businessName: string;
  applicantName: string;
  mobile: string;
  whatsapp: string;
  email: string;
  street: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
}

interface AttachedDocument {
  id: string;
  file: File;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
}

export default function RegisterKYCPage() {
  const router = useRouter();
  const { addToast } = useApp();

  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('iccha_kyc_step1');
        if (saved) {
          setStep1Data(JSON.parse(saved));
          return;
        }
      } catch {
        // ignore
      }
      // No Step 1 data found — send them back rather than silently faking it
      addToast({
        type: 'warning',
        title: 'Start from Step 1',
        message: 'Please complete your business profile first.'
      });
      router.push('/register');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDropShipper = step1Data?.accountType === 'drop_shipper';

  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [documentType, setDocumentType] = useState<'gst_certificate' | 'shop_act' | 'udyam_msme' | 'trade_license'>('gst_certificate');

  const [documents, setDocuments] = useState<AttachedDocument[]>([]);
  const [socialProof, setSocialProof] = useState('');
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStage, setSubmitStage] = useState<'idle' | 'registering' | 'uploading'>('idle');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocuments(prev => [
        ...prev,
        {
          id: `doc-${Date.now()}`,
          file,
          type,
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          uploadedAt: new Date().toISOString().split('T')[0]
        }
      ]);
      addToast({
        type: 'success',
        title: 'Document Attached',
        message: `${file.name} will be submitted with your application.`
      });
    }
    // Allow re-selecting the same filename later without the input silently no-op'ing
    e.target.value = '';
  };

  const removeDoc = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  // Drop shipper social proof: at most one business card / screenshot file
  const businessCardDoc = documents.find(d => d.type === 'business_card');

  const handleBusinessCardSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocuments(prev => [
        ...prev.filter(d => d.type !== 'business_card'),
        {
          id: `doc-${Date.now()}`,
          file,
          type: 'business_card',
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          uploadedAt: new Date().toISOString().split('T')[0]
        }
      ]);
    }
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!step1Data) return;

    if (!isDropShipper && !gstin.trim()) {
      addToast({ type: 'warning', title: 'GSTIN Required', message: 'Please enter your GSTIN.' });
      return;
    }

    if (password.length < 8) {
      addToast({ type: 'warning', title: 'Weak Password', message: 'Password must be at least 8 characters.' });
      return;
    }

    if (password !== confirmPassword) {
      addToast({ type: 'warning', title: 'Passwords Don\'t Match', message: 'Please re-enter your password.' });
      return;
    }

    if (isDropShipper && !socialProof.trim() && !businessCardDoc) {
      addToast({
        type: 'warning',
        title: 'Social Proof Required',
        message: 'Please add your Instagram / social link or upload a business card.'
      });
      return;
    }

    if (!declarationChecked) {
      addToast({
        type: 'warning',
        title: 'Declaration Required',
        message: 'Please accept the wholesale trade declaration to submit your KYC.'
      });
      return;
    }

    if (!isDropShipper && documents.length === 0) {
      addToast({
        type: 'error',
        title: 'Document Required',
        message: 'Please upload at least one valid GST Certificate or Business Proof.'
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStage('registering');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: step1Data.email,
          password,
          accountType: step1Data.accountType,
          businessName: step1Data.businessName,
          applicantName: step1Data.applicantName,
          mobile: step1Data.mobile,
          whatsapp: step1Data.whatsapp,
          gstin: isDropShipper ? undefined : gstin,
          pan: pan || undefined,
          socialProof: isDropShipper ? socialProof.trim() || undefined : undefined,
          street: step1Data.street,
          city: step1Data.city,
          state: step1Data.state,
          stateCode: step1Data.stateCode,
          pincode: step1Data.pincode,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        addToast({
          type: 'error',
          title: 'Submission Error',
          message: result.error || 'Failed to submit application. Please check your details.'
        });
        setIsSubmitting(false);
        setSubmitStage('idle');
        return;
      }

      const applicationId: string | undefined = result.data.kycApplicationId;

      if (applicationId && documents.length > 0) {
        setSubmitStage('uploading');
        let failedCount = 0;

        for (const doc of documents) {
          try {
            const uploadForm = new FormData();
            uploadForm.append('file', doc.file);
            uploadForm.append('applicationId', applicationId);
            uploadForm.append('documentType', doc.type);

            const uploadRes = await fetch('/api/kyc/documents/upload', {
              method: 'POST',
              body: uploadForm,
            });

            if (!uploadRes.ok) failedCount += 1;
          } catch {
            failedCount += 1;
          }
        }

        if (failedCount > 0) {
          addToast({
            type: 'warning',
            title: 'Some Documents Didn\'t Upload',
            message: `${failedCount} of ${documents.length} document(s) failed to upload. Your application was still submitted — contact support to add them.`
          });
        }
      }

      localStorage.removeItem('iccha_kyc_step1');

      addToast({
        type: 'success',
        title: 'Application Submitted!',
        message: 'Your application is now under review. You\'ll be able to log in once approved.'
      });

      router.push(`/application-status?email=${encodeURIComponent(step1Data.email)}`);
    } catch (err) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Submission Error',
        message: 'Something went wrong. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
      setSubmitStage('idle');
    }
  };

  if (!step1Data) return null;

  const submitLabel =
    submitStage === 'registering' ? 'Submitting Application...' :
    submitStage === 'uploading' ? 'Uploading Documents...' :
    'Submit Application';

  return (
    <div className="flex flex-col min-h-screen">
      <PublicHeader />

      <main className="flex-1 py-12 bg-[#faf8f5]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="mb-8 space-y-4 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#831843] text-xs font-bold uppercase tracking-wider">
              <FileCheck className="w-3.5 h-3.5 text-rose-700" />
              Step 2: KYC & Business Verification
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
              {isDropShipper ? 'Set Your Account Password' : 'Upload GST & Trade Credentials'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto">
              IcchaStore strictly verifies reseller status to protect wholesale factory margins for authentic apparel boutiques and stores.
            </p>

            {/* Stepper indicator */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link href="/register" className="flex items-center gap-2 text-xs font-bold text-emerald-700 hover:underline">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                  ✓
                </span>
                <span>Business Profile</span>
              </Link>
              <div className="w-12 h-0.5 bg-rose-900" />
              <div className="flex items-center gap-2 text-xs font-bold text-[#831843]">
                <span className="w-6 h-6 rounded-full bg-[#831843] text-white flex items-center justify-center text-xs">
                  2
                </span>
                <span>KYC & GST Documents</span>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-sm space-y-6">
            
            {/* Step 1 Summary Banner */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 block">
                  Applying As: {isDropShipper ? 'Drop Shipper' : 'Retailer'}
                </span>
                <strong className="text-stone-900 text-sm">{step1Data.businessName}</strong>
                <div className="text-stone-500">
                  {step1Data.applicantName} ({step1Data.mobile}) &bull; {step1Data.city}, {step1Data.state}
                </div>
              </div>
              <Link
                href="/register"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#831843] hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Edit Profile
              </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 text-xs">

              {/* Account Password */}
              <div className="space-y-4">
                <h3 className="font-serif text-base font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Set Your Login Password
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-stone-800 mb-1">Password *</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-800 mb-1">Confirm Password *</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-900 font-medium"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-stone-500">
                  You'll use this with your email ({step1Data.email}) to log in once your application is approved.
                </p>
              </div>

              {/* GST & PAN Credentials */}
              <div className="space-y-4">
                <h3 className="font-serif text-base font-bold text-stone-900 border-b border-stone-100 pb-2">
                  {isDropShipper ? '2. Tax Identifier (Optional)' : '2. GSTIN & Tax Identifiers'}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {!isDropShipper && (
                    <div>
                      <label className="block font-semibold text-stone-800 mb-1">
                        15-Digit Goods & Services Tax (GSTIN) *
                      </label>
                      <input
                        type="text"
                        required
                        value={gstin}
                        onChange={e => setGstin(e.target.value.toUpperCase())}
                        placeholder="e.g. 08AABCA1234F1Z8"
                        maxLength={15}
                        className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-900 font-mono font-bold text-stone-900 tracking-wider"
                      />
                      <span className="text-[10px] text-stone-500 mt-1 block">
                        Standard Indian GSTIN format with State Code prefix.
                      </span>
                    </div>
                  )}

                  {isDropShipper && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 flex items-center sm:col-span-2">
                      GSTIN is not required for Drop Shipper accounts.
                    </div>
                  )}

                  <div>
                    <label className="block font-semibold text-stone-800 mb-1">
                      10-Digit Income Tax PAN Number
                    </label>
                    <input
                      type="text"
                      value={pan}
                      onChange={e => setPan(e.target.value.toUpperCase())}
                      placeholder="e.g. AABCA1234F"
                      maxLength={10}
                      className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-900 font-mono font-bold text-stone-900 tracking-wider"
                    />
                  </div>
                </div>
              </div>

              {/* Social Proof (Drop Shipper only) */}
              {isDropShipper && (
                <div className="space-y-4">
                  <h3 className="font-serif text-base font-bold text-stone-900 border-b border-stone-100 pb-2">
                    3. Social Proof (Required)
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Please provide at least one: your Instagram / social media page, or a photo of your business card.
                  </p>

                  <div>
                    <label className="block font-semibold text-stone-800 mb-1">
                      Instagram / Social Media Handle or Link
                    </label>
                    <input
                      type="text"
                      value={socialProof}
                      onChange={e => setSocialProof(e.target.value)}
                      placeholder="e.g. @yourbrand or https://instagram.com/yourbrand"
                      maxLength={200}
                      className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-900 font-medium"
                    />
                  </div>

                  <div className="text-center text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    and / or
                  </div>

                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-5 h-5 text-amber-700 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-semibold text-stone-800 block truncate">
                          {businessCardDoc ? businessCardDoc.name : 'No business card attached'}
                        </span>
                        <span className="text-[10px] text-stone-500">
                          Business card or any proof of your business (JPG, PNG, WebP or PDF).
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <label className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold rounded-lg cursor-pointer">
                        <span>{businessCardDoc ? 'Change File' : 'Upload File'}</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          onChange={handleBusinessCardSelect}
                          className="hidden"
                        />
                      </label>
                      {businessCardDoc && (
                        <button
                          type="button"
                          onClick={() => removeDoc(businessCardDoc.id)}
                          className="text-stone-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Document Upload Section */}
              {!isDropShipper && (
                <div className="space-y-4">
                  <h3 className="font-serif text-base font-bold text-stone-900 border-b border-stone-100 pb-2">
                    3. Business Proof Document Upload
                  </h3>

                  <div>
                    <label className="block font-semibold text-stone-800 mb-1">
                      Primary Proof Document Type *
                    </label>
                    <select
                      value={documentType}
                      onChange={e => setDocumentType(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-900 font-medium"
                    >
                      <option value="gst_certificate">GST Registration Certificate (Form GST REG-06)</option>
                      <option value="shop_act">Shop & Commercial Establishment Act License</option>
                      <option value="udyam_msme">Udyam MSME Registration Certificate</option>
                      <option value="trade_license">Municipal Corporation Trade License</option>
                    </select>
                  </div>

                  <div className="border-2 border-dashed border-stone-300 hover:border-rose-700 bg-stone-50/60 rounded-2xl p-6 text-center transition">
                    <Upload className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                    <p className="font-semibold text-stone-800 text-sm">
                      Drag and drop your document here, or browse
                    </p>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Supports PDF, JPG, PNG files (Max file size: 5 MB)
                    </p>
                    <label className="inline-block mt-3 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-semibold cursor-pointer shadow-sm transition">
                      <span>Select File from Device</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={e => handleFileSelect(e, documentType)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="space-y-2">
                    <span className="font-semibold text-stone-700 block">
                      Attached Documents ({documents.length}):
                    </span>
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-rose-100 text-[#831843] rounded-lg">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <strong className="text-stone-900 block">{doc.name}</strong>
                            <span className="text-[10px] text-stone-500">
                              {doc.size} &bull; {doc.type.replace('_', ' ').toUpperCase()} &bull; Attached on {doc.uploadedAt}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                            Ready to Submit
                          </span>
                          <button
                            type="button"
                            onClick={() => removeDoc(doc.id)}
                            className="text-stone-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Declaration Checkbox */}
              <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-2xl space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={declarationChecked}
                    onChange={e => setDeclarationChecked(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-[#831843] focus:ring-rose-800"
                  />
                  <div className="text-stone-700 leading-relaxed text-xs">
                    <strong className="text-stone-900 block">Wholesale B2B Reseller Undertaking:</strong>
                    I certify that our business is a registered garment retailer/boutique and goods ordered from IcchaStore are intended solely for commercial resale and business operations. I agree to keep factory wholesale lot rates confidential.
                  </div>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <Link
                  href="/register"
                  className="text-stone-600 hover:text-stone-900 font-semibold flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Step 1
                </Link>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#831843] to-[#9a3412] hover:from-[#701a75] hover:to-[#852e10] text-white font-bold shadow-xl transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>{submitLabel}</span>
                </button>
              </div>

            </form>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}