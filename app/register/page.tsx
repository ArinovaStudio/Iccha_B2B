'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  FileCheck,
  Lock,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import PublicHeader from '@/components/layout/PublicHeader';
import Footer from '@/components/layout/Footer';
import { useApp } from '@/lib/context/AppContext';

type AccountType = 'retailer' | 'drop_shipper';
type DocumentType = 'gst_certificate' | 'shop_act' | 'udyam_msme' | 'trade_license' | 'business_card';

interface FormData {
  accountType: AccountType;
  businessName: string;
  applicantName: string;
  mobile: string;
  whatsapp: string;
  email: string;
  address: string;
}

interface AttachedDocument {
  id: string;
  file: File;
  name: string;
  size: string;
  type: DocumentType;
}

const STATE_CODES: Record<string, string> = {
  'Jammu and Kashmir': '01',
  'Himachal Pradesh': '02',
  'Punjab': '03',
  'Chandigarh': '04',
  'Uttarakhand': '05',
  'Haryana': '06',
  'Delhi': '07',
  'Rajasthan': '08',
  'Uttar Pradesh': '09',
  'Bihar': '10',
  'Sikkim': '11',
  'Arunachal Pradesh': '12',
  'Nagaland': '13',
  'Manipur': '14',
  'Mizoram': '15',
  'Tripura': '16',
  'Meghalaya': '17',
  'Assam': '18',
  'West Bengal': '19',
  'Jharkhand': '20',
  'Odisha': '21',
  'Chhattisgarh': '22',
  'Madhya Pradesh': '23',
  'Gujarat': '24',
  'Maharashtra': '27',
  'Karnataka': '29',
  'Goa': '30',
  'Lakshadweep': '31',
  'Kerala': '32',
  'Tamil Nadu': '33',
  'Puducherry': '34',
  'Andaman and Nicobar Islands': '35',
  'Telangana': '36',
  'Andhra Pradesh': '37',
  'Ladakh': '38',
};

// Finds the state named inside a free-text address (longest name first).
function detectState(address: string): { state: string; stateCode: string } {
  const text = address.toLowerCase();
  const match = Object.keys(STATE_CODES)
    .sort((a, b) => b.length - a.length)
    .find((name) => text.includes(name.toLowerCase()));
  return match ? { state: match, stateCode: STATE_CODES[match] } : { state: 'Other', stateCode: '99' };
}

const inputClass = 'w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-900 outline-none transition focus:border-rose-900 focus:ring-2 focus:ring-rose-100';
const labelClass = 'mb-1 block text-xs font-semibold text-stone-800';

export default function RegisterPage() {
  const router = useRouter();
  const { addToast } = useApp();

  const [formData, setFormData] = useState<FormData>({
    accountType: 'drop_shipper',
    businessName: '',
    applicantName: '',
    mobile: '',
    whatsapp: '',
    email: '',
    address: '',
  });
  const [gstin, setGstin] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [socialProof, setSocialProof] = useState('');
  const [documentType, setDocumentType] = useState<Exclude<DocumentType, 'business_card'>>('gst_certificate');
  const [documents, setDocuments] = useState<AttachedDocument[]>([]);
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStage, setSubmitStage] = useState<'idle' | 'registering' | 'uploading'>('idle');

  const isDropShipper = formData.accountType === 'drop_shipper';
  const businessCardDoc = documents.find((doc) => doc.type === 'business_card');

  const updateForm = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const addDocument = (file: File, type: DocumentType) => {
    if (file.size > 5 * 1024 * 1024) {
      addToast({ type: 'warning', title: 'File Too Large', message: 'Each document must be 5 MB or smaller.' });
      return;
    }
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      addToast({ type: 'warning', title: 'Unsupported File', message: 'Upload a PDF, JPG, PNG, or WebP file.' });
      return;
    }
    setDocuments((prev) => [
      ...prev.filter((doc) => type !== 'business_card' || doc.type !== 'business_card'),
      { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, file, name: file.name, size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`, type },
    ]);
    addToast({ type: 'success', title: 'Document Attached', message: `${file.name} is ready to submit.` });
  };

  const handleDocumentSelect = (event: React.ChangeEvent<HTMLInputElement>, type: DocumentType) => {
    const file = event.target.files?.[0];
    if (file) addDocument(file, type);
    event.target.value = '';
  };

  const removeDocument = (id: string) => setDocuments((prev) => prev.filter((doc) => doc.id !== id));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (formData.mobile.replace(/\D/g, '').length < 10) {
      addToast({ type: 'warning', title: 'Check Mobile Number', message: 'Enter a valid mobile number with at least 10 digits.' });
      return;
    }
    if (password && password.length < 8) {
      addToast({ type: 'warning', title: 'Weak Password', message: 'Password must be at least 8 characters, or leave it blank to use your mobile number.' });
      return;
    }
    if (password && password !== confirmPassword) {
      addToast({ type: 'warning', title: "Passwords Don't Match", message: 'Please enter the same password in both fields.' });
      return;
    }
    if (!isDropShipper && !gstin.trim()) {
      addToast({ type: 'warning', title: 'GSTIN Required', message: 'Enter your GSTIN for a GST retailer account.' });
      return;
    }
    if (gstin.trim() && !/^[0-9A-Z]{15}$/.test(gstin.trim().toUpperCase())) {
      addToast({ type: 'warning', title: 'Invalid GSTIN', message: 'GSTIN must contain 15 letters and numbers.' });
      return;
    }
    if (isDropShipper && !socialProof.trim() && !businessCardDoc) {
      addToast({ type: 'warning', title: 'Social Proof Required', message: 'Add a social media link or upload a business card.' });
      return;
    }
    if (!isDropShipper && documents.length === 0) {
      addToast({ type: 'warning', title: 'Document Required', message: 'Upload at least one GST certificate or business proof document.' });
      return;
    }
    if (!declarationChecked) {
      addToast({ type: 'warning', title: 'Declaration Required', message: 'Accept the wholesale trade declaration to submit your application.' });
      return;
    }

    const detected = detectState(formData.address);

    setIsSubmitting(true);
    setSubmitStage('registering');
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim() || undefined,
          password: password || undefined,
          accountType: formData.accountType,
          businessName: formData.businessName.trim(),
          applicantName: formData.applicantName.trim(),
          mobile: formData.mobile.trim(),
          whatsapp: formData.whatsapp.trim() || formData.mobile.trim(),
          gstin: isDropShipper ? undefined : gstin.trim().toUpperCase(),
          socialProof: isDropShipper ? socialProof.trim() || undefined : undefined,
          state: detected.state,
          stateCode: detected.stateCode,
          // The full address goes in `street`; the state is detected from it.
          street: formData.address.trim(),
          city: '',
          pincode: '',
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        addToast({ type: 'error', title: 'Submission Error', message: result.error || 'Failed to submit application. Please check your details.' });
        return;
      }

      const applicationId: string | undefined = result.data?.kycApplicationId;
      let failedCount = 0;
      if (applicationId && documents.length) {
        setSubmitStage('uploading');
        for (const doc of documents) {
          try {
            const uploadForm = new FormData();
            uploadForm.append('file', doc.file);
            uploadForm.append('applicationId', applicationId);
            uploadForm.append('documentType', doc.type);
            const uploadResponse = await fetch('/api/kyc/documents/upload', { method: 'POST', body: uploadForm });
            if (!uploadResponse.ok) failedCount += 1;
          } catch {
            failedCount += 1;
          }
        }
      } else if (documents.length) {
        failedCount = documents.length;
      }

      if (failedCount) {
        addToast({ type: 'warning', title: 'Some Documents Did Not Upload', message: `${failedCount} of ${documents.length} document(s) failed to upload. Contact support to add them.` });
      }
      addToast({ type: 'success', title: 'Application Submitted', message: 'Your application has been submitted for review.' });
      const identifier = formData.email.trim() || formData.mobile.trim();
      router.push(`/application-status?identifier=${encodeURIComponent(identifier)}`);
    } catch (error) {
      console.error('Registration submission failed:', error);
      addToast({ type: 'error', title: 'Submission Error', message: 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
      setSubmitStage('idle');
    }
  };

  const submitLabel = submitStage === 'registering' ? 'Submitting Application…' : submitStage === 'uploading' ? 'Uploading Documents…' : 'Submit Registration & KYC';

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1 bg-[#faf8f5] py-10 sm:py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <header className="mb-8 space-y-3 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#831843]">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" /> Retailer Onboarding Portal
            </div>
            <h1 className="font-serif text-3xl font-bold text-stone-900 sm:text-4xl">Apply for a B2B Retailer Account</h1>
            <p className="mx-auto max-w-xl text-sm text-stone-600">Complete your business profile, login details, and KYC documents in one form.</p>
            <div className="flex items-center justify-center gap-2 pt-2 text-xs font-semibold text-stone-600 sm:gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-2 text-[#831843]"><CheckCircle2 className="h-4 w-4" /> Business details</span>
              <ArrowRight className="h-4 w-4 text-stone-400" />
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-2 text-[#831843]"><FileCheck className="h-4 w-4" /> KYC & documents</span>
            </div>
          </header>

          <div className="mb-5 flex flex-col items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-900 sm:flex-row">
            <div className="flex items-start gap-2.5"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" /><p><strong>Account activity notice:</strong> Accounts inactive for an extended period (more than 15 days without logins or orders) may be deactivated. Contact the admin if you need reactivation.</p></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-7 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-9">
            <section className="space-y-4">
              <h2 className="border-b border-stone-100 pb-2 font-serif text-lg font-bold text-stone-900">1. Business & applicant details</h2>
              <div><label className={labelClass}>Registered business / boutique name *</label><input className={inputClass} required maxLength={120} value={formData.businessName} onChange={(e) => updateForm('businessName', e.target.value)} placeholder="e.g. Saffron Styles & Boutiques" /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className={labelClass}>Applicant full name *</label><input className={inputClass} required value={formData.applicantName} onChange={(e) => updateForm('applicantName', e.target.value)} placeholder="Your full name" /></div>
                <div><label className={labelClass}>Mobile number *</label><input className={inputClass} type="tel" required value={formData.mobile} onChange={(e) => updateForm('mobile', e.target.value)} placeholder="+91 98250 12345" /></div>
                <div><label className={labelClass}>WhatsApp number</label><input className={inputClass} type="tel" value={formData.whatsapp} onChange={(e) => updateForm('whatsapp', e.target.value)} placeholder="Same as mobile if blank" /></div>
                <div><label className={labelClass}>Official email (optional)</label><input className={inputClass} type="email" value={formData.email} onChange={(e) => updateForm('email', e.target.value)} placeholder="orders@yourboutique.com" /><p className="mt-1 text-[11px] text-stone-500">You can register with your mobile number if you do not have an email address.</p></div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="border-b border-stone-100 pb-2 font-serif text-lg font-bold text-stone-900">2. Business address</h2>
              <div>
                <label className={labelClass}>Address (including state) *</label>
                <textarea className={inputClass} required rows={3} maxLength={300} value={formData.address} onChange={(e) => updateForm('address', e.target.value)} placeholder="Shop / building, street, city, state, pincode" />
                <p className="mt-1 text-[11px] text-stone-500">Enter your complete address with the state name in one place.</p>
              </div>
            </section>

            {isDropShipper ? (
              <section className="space-y-4">
                <h2 className="border-b border-stone-100 pb-2 font-serif text-lg font-bold text-stone-900">3. Social / business proof</h2>
                <p className="text-xs text-stone-600">Provide a social media link or upload a business card / business proof document.</p>
                <div><label className={labelClass}>Instagram / social media link</label><input className={inputClass} maxLength={200} value={socialProof} onChange={(e) => setSocialProof(e.target.value)} placeholder="@yourbrand or https://instagram.com/yourbrand" /></div>
                <div className="flex flex-col justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3 sm:flex-row sm:items-center"><div className="flex min-w-0 items-center gap-2"><FileText className="h-5 w-5 shrink-0 text-amber-700" /><div className="min-w-0"><span className="block truncate text-xs font-semibold text-stone-800">{businessCardDoc?.name || 'Business card / proof (optional if link provided)'}</span><span className="text-[11px] text-stone-500">PDF, JPG, PNG or WebP, max 5 MB</span></div></div><label className="cursor-pointer rounded-lg bg-stone-200 px-3 py-2 text-center text-xs font-semibold text-stone-800 hover:bg-stone-300">{businessCardDoc ? 'Change file' : 'Upload file'}<input className="hidden" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => handleDocumentSelect(e, 'business_card')} /></label></div>
                {businessCardDoc && <button type="button" onClick={() => removeDocument(businessCardDoc.id)} className="inline-flex items-center gap-1 text-xs text-rose-700 hover:underline"><Trash2 className="h-3.5 w-3.5" /> Remove business proof</button>}
              </section>
            ) : (
              <section className="space-y-4">
                <h2 className="border-b border-stone-100 pb-2 font-serif text-lg font-bold text-stone-900">6. Business proof documents</h2>
                <div><label className={labelClass}>Document type *</label><select className={inputClass} value={documentType} onChange={(e) => setDocumentType(e.target.value as Exclude<DocumentType, 'business_card'>)}><option value="gst_certificate">GST Registration Certificate (GST REG-06)</option><option value="shop_act">Shop & Commercial Establishment License</option><option value="udyam_msme">Udyam MSME Registration Certificate</option><option value="trade_license">Municipal Trade License</option></select></div>
                <div className="rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50/60 p-6 text-center transition hover:border-rose-700"><Upload className="mx-auto mb-2 h-8 w-8 text-stone-400" /><p className="text-sm font-semibold text-stone-800">Upload your GST certificate or business proof</p><p className="mt-1 text-[11px] text-stone-500">PDF, JPG, PNG or WebP. Maximum 5 MB per file.</p><label className="mt-3 inline-block cursor-pointer rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-stone-800">Select file<input className="hidden" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => handleDocumentSelect(e, documentType)} /></label></div>
                {documents.length > 0 && <div className="space-y-2"><p className="text-xs font-semibold text-stone-700">Attached documents ({documents.length})</p>{documents.map((doc) => <div key={doc.id} className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3"><div className="flex min-w-0 items-center gap-3"><span className="rounded-lg bg-rose-100 p-2 text-[#831843]"><FileText className="h-4 w-4" /></span><div className="min-w-0"><strong className="block truncate text-xs text-stone-900">{doc.name}</strong><span className="text-[10px] text-stone-500">{doc.size} · {doc.type.replaceAll('_', ' ').toUpperCase()}</span></div></div><button type="button" onClick={() => removeDocument(doc.id)} aria-label={`Remove ${doc.name}`} className="shrink-0 p-1 text-stone-400 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button></div>)}</div>}
              </section>
            )}

            <section className="space-y-4">
              <h2 className="border-b border-stone-100 pb-2 font-serif text-lg font-bold text-stone-900">4. Login password</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className={labelClass}><Lock className="mr-1 inline h-3.5 w-3.5" /> Password (optional)</label><input className={inputClass} type="password" minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to use mobile number" /></div>
                <div><label className={labelClass}>Confirm password</label><input className={inputClass} type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" /></div>
              </div>
              <p className="text-[11px] text-stone-500">After approval, you can log in using {formData.email.trim() || formData.mobile || 'your email or mobile number'} and your password.</p>
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><strong>Note:</strong> If you do not enter a password, your 10-digit mobile number will be your password. You can change it after logging in.</p>
            </section>

            <section className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
              <h2 className="font-serif text-base font-bold text-stone-900">Wholesale B2B Reseller Undertaking</h2>
              <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-stone-700"><input className="mt-1 h-4 w-4 rounded accent-[#831843]" type="checkbox" checked={declarationChecked} onChange={(e) => setDeclarationChecked(e.target.checked)} /><span>I certify that my business is a garment retailer, boutique, or reseller and that goods ordered from IcchaStore are intended for commercial resale and business operations. I agree to keep factory wholesale prices confidential.</span></label>
            </section>

            <div className="flex flex-col items-center justify-between gap-4 border-t border-stone-200 pt-5 sm:flex-row"><div className="flex items-center gap-1.5 text-xs text-stone-500"><ShieldCheck className="h-4 w-4 text-emerald-700" /> Secure B2B onboarding</div><button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#831843] to-[#9a3412] px-7 py-3.5 text-sm font-bold text-white shadow-lg transition hover:from-[#701a75] hover:to-[#852e10] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"><CheckCircle2 className="h-4 w-4 text-emerald-200" />{submitLabel}</button></div>
          </form>

          <div className="mt-6 text-center text-xs text-stone-600">Already applied? <Link href="/application-status" className="font-bold text-[#831843] hover:underline">Check application status</Link><span className="mx-2">·</span><Link href="/login" className="font-bold text-stone-900 hover:underline">Retailer login</Link></div>
        </div>
      </main>
      <Footer />
    </div>
  );
}