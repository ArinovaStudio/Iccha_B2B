'use client';



import React, { useState, useEffect, useRef } from 'react';

import AdminSidebar from '@/components/layout/AdminSidebar';

import { useApp } from '@/lib/context/AppContext';

import Image from 'next/image';

import { useAdminRole } from '@/components/layout/AdminRoleContext';

import {

  Save,

  Building2,

  CreditCard,

  MapPin,

  User,

  Pencil,

  X,

  Lock,

  Shield,

  Mail,

  Clock,

  CalendarClock,

  CheckCircle2,

  XCircle,

  Phone,

  ImagePlus,

  Trash2

} from 'lucide-react';



interface VendorProfileData {

  businessName: string;

  contactName: string;

  mobile: string;

  email: string;

  gstin: string;

  pan: string | null;

  address: string;

  city: string;

  state: string;

  stateCode: string;

  bankName: string | null;

  accountHolder: string | null;

  accountNumber: string | null;

  ifsc: string | null;

  branch: string | null;

  upiId: string | null;

  invoicePrefix: string;

  defaultGstRate: string;

  isActive: boolean;

  bannerAsset: { publicUrl: string } | null;

  description: string | null;

}



export default function ProfilePage() {

  const role = useAdminRole();



  // VENDOR_ALLOWED_ADMIN_PATHS lets vendors reach /admin/profile too (shared area),

  // so this page renders a different form depending on who's looking at it.

  if (role === 'VENDOR') {

    return <VendorProfilePage />;

  }



  return <StaffProfilePage />;

}



const BANNER_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const BANNER_MAX_BYTES = 8 * 1024 * 1024;



function VendorProfilePage() {

  const { addToast } = useApp();

  const [profile, setProfile] = useState<VendorProfileData | null>(null);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [isEditing, setIsEditing] = useState(false);

  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [changingPassword, setChangingPassword] = useState(false);

  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [bannerBusy, setBannerBusy] = useState(false);

  const [passwordForm, setPasswordForm] = useState({

    oldPassword: '',

    newPassword: '',

    confirmPassword: '',

  });

  const [form, setForm] = useState({

    contactName: '',

    mobile: '',

    address: '',

    city: '',

    state: '',

    stateCode: '',

    bankName: '',

    accountHolder: '',

    accountNumber: '',

    ifsc: '',

    branch: '',

    upiId: '',

    description: ''

  });



  const buildFormFromProfile = (data: VendorProfileData) => ({

    contactName: data.contactName || '',

    mobile: data.mobile || '',

    address: data.address || '',

    city: data.city || '',

    state: data.state || '',

    stateCode: data.stateCode || '',

    bankName: data.bankName || '',

    accountHolder: data.accountHolder || '',

    accountNumber: data.accountNumber || '',

    ifsc: data.ifsc || '',

    branch: data.branch || '',

    upiId: data.upiId || '',
    description: data.description || '',

  });



  const loadProfile = async () => {

    setLoading(true);

    try {

      const res = await fetch('/api/vendor/profile');

      const json = await res.json();

      if (json.success) {

        setProfile(json.data);

        setForm(buildFormFromProfile(json.data));

      } else {

        addToast({ type: 'error', title: 'Failed to load profile', message: json.error });

      }

    } catch {

      addToast({ type: 'error', title: 'Network error', message: 'Could not load profile.' });

    } finally {

      setLoading(false);

    }

  };



  useEffect(() => {

    loadProfile();

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, []);



  const handleEdit = () => {

    setIsEditing(true);

  };



  const handleCancel = () => {

    if (profile) setForm(buildFormFromProfile(profile)); // discard unsaved changes

    setIsEditing(false);

  };



  const handleSave = async (e: React.FormEvent) => {

    e.preventDefault();

    setSaving(true);

    try {

      const res = await fetch('/api/vendor/profile', {

        method: 'PATCH',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify(form),

      });

      const json = await res.json();

      if (json.success) {

        addToast({ type: 'success', title: 'Profile Updated', message: 'Your details have been saved.' });

        await loadProfile();

        setIsEditing(false);

      } else {

        addToast({ type: 'error', title: 'Update failed', message: json.error });

      }

    } catch {

      addToast({ type: 'error', title: 'Network error', message: 'Could not save changes.' });

    } finally {

      setSaving(false);

    }

  };



  const handleBannerSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0];

    e.target.value = ''; // lets the vendor re-pick the same file later

    if (!file) return;



    if (!BANNER_TYPES.includes(file.type)) {

      addToast({ type: 'error', title: 'Unsupported file', message: 'Please choose a JPG, PNG or WebP image.' });

      return;

    }

    if (file.size > BANNER_MAX_BYTES) {

      addToast({ type: 'error', title: 'Image too large', message: 'Banner must be 8 MB or smaller.' });

      return;

    }



    setBannerBusy(true);

    try {

      const body = new FormData();

      body.append('file', file);

      const res = await fetch('/api/vendor/profile/banner', { method: 'POST', body });

      const json = await res.json();

      if (json.success) {

        // Update locally instead of loadProfile(), which would blank the page and drop unsaved edits.

        setProfile(p => (p ? { ...p, bannerAsset: { publicUrl: json.data.bannerUrl } } : p));

        addToast({ type: 'success', title: 'Banner Updated', message: 'It now shows on the homepage vendor section.' });

      } else {

        addToast({ type: 'error', title: 'Upload failed', message: json.error });

      }

    } catch {

      addToast({ type: 'error', title: 'Network error', message: 'Could not upload the banner.' });

    } finally {

      setBannerBusy(false);

    }

  };



  const handleBannerRemove = async () => {

    if (!window.confirm('Remove your banner? Your latest product photo will be shown instead.')) return;

    setBannerBusy(true);

    try {

      const res = await fetch('/api/vendor/profile/banner', { method: 'DELETE' });

      const json = await res.json();

      if (json.success) {

        setProfile(p => (p ? { ...p, bannerAsset: null } : p));

        addToast({ type: 'success', title: 'Banner Removed', message: 'Your latest product photo is used instead.' });

      } else {

        addToast({ type: 'error', title: 'Remove failed', message: json.error });

      }

    } catch {

      addToast({ type: 'error', title: 'Network error', message: 'Could not remove the banner.' });

    } finally {

      setBannerBusy(false);

    }

  };



  if (loading || !profile) {

    return (

      <div className="flex min-h-screen bg-[#faf8f5]">

        <AdminSidebar activeTab="profile" />

        <main className="flex-1 p-6 lg:p-10 flex items-center justify-center">

          <div className="text-xs text-stone-500">Loading profile...</div>

        </main>

      </div>

    );

  }



  const fieldClass = (editable: boolean) =>

    `w-full px-3 py-2 rounded-xl border focus:outline-none transition ${editable

      ? 'bg-stone-50 border-stone-300 focus:border-rose-900'

      : 'bg-stone-100 border-stone-200 text-stone-600 cursor-not-allowed'

    }`;



  const handleChangePassword = async (e: React.FormEvent) => {

    e.preventDefault();



    if (passwordForm.newPassword !== passwordForm.confirmPassword) {

      addToast({ type: 'error', title: 'Passwords don\'t match', message: 'New password and confirmation must match.' });

      return;

    }



    setChangingPassword(true);

    try {

      const res = await fetch('/api/vendor/profile/password', {

        method: 'PATCH',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify(passwordForm),

      });

      const json = await res.json();



      if (json.success) {

        addToast({ type: 'success', title: 'Password Changed', message: 'Use your new password next time you log in.' });

        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });

        setIsChangingPassword(false);

      } else {

        addToast({ type: 'error', title: 'Change failed', message: json.error });

      }

    } catch {

      addToast({ type: 'error', title: 'Network error', message: 'Could not change password.' });

    } finally {

      setChangingPassword(false);

    }

  };



  const handleCancelPasswordChange = () => {

    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });

    setIsChangingPassword(false);

  };



  return (

    <div className="flex min-h-screen bg-[#faf8f5]">

      <AdminSidebar activeTab="profile" />



      <main className="flex-1 min-w-0 p-6 lg:p-10 overflow-y-auto">

        <div className="w-full max-w-4xl space-y-6">



        <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-6">

          <div>

            <span className="text-xs uppercase font-bold tracking-widest text-[#831843]">

              My Account

            </span>

            <h1 className="font-serif text-3xl font-bold text-stone-900 mt-1">

              Vendor Profile

            </h1>

            <p className="text-xs text-stone-500 mt-0.5">

              Manage your contact, address, and payout details. Legal identifiers (GSTIN, PAN, business name) require staff approval to change — contact support.

            </p>

          </div>



          {!isEditing && (

            <button

              type="button"

              onClick={handleEdit}

              className="px-4 py-2.5 bg-[#831843] hover:bg-rose-900 text-white rounded-xl font-bold text-xs shadow transition flex items-center gap-2 shrink-0"

            >

              <Pencil className="w-3.5 h-3.5" />

              <span>Edit Details</span>

            </button>

          )}

        </div>



        {/* Locked / staff-only fields, always read-only */}

        <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-3 text-xs">

          <div className="flex items-center gap-2 font-bold text-stone-800 mb-1">

            <Building2 className="w-4 h-4 text-stone-500" />

            Business Identity (Staff-Managed)

          </div>

          <div className="grid grid-cols-2 gap-3">

            <div>

              <span className="text-[10px] uppercase font-bold text-stone-400 block">Business Name</span>

              <span className="font-semibold text-stone-800">{profile.businessName}</span>

            </div>

            <div>

              <span className="text-[10px] uppercase font-bold text-stone-400 block">Login Email</span>

              <span className="font-semibold text-stone-800">{profile.email}</span>

            </div>

            <div>

              <span className="text-[10px] uppercase font-bold text-stone-400 block">GSTIN</span>

              <span className="font-mono font-semibold text-stone-800">{profile.gstin}</span>

            </div>

            <div>

              <span className="text-[10px] uppercase font-bold text-stone-400 block">PAN</span>

              <span className="font-mono font-semibold text-stone-800">{profile.pan || '—'}</span>

            </div>

            <div>

              <span className="text-[10px] uppercase font-bold text-stone-400 block">Invoice Prefix</span>

              <span className="font-mono font-semibold text-stone-800">{profile.invoicePrefix}</span>

            </div>

            <div>

              <span className="text-[10px] uppercase font-bold text-stone-400 block">Default GST Rate</span>

              <span className="font-semibold text-stone-800">{profile.defaultGstRate}%</span>

            </div>

          </div>

        </div>



        {/* Storefront banner: the background of your tile on the homepage vendor rail */}

        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm text-xs">

          <h3 className="font-serif text-base font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">

            <ImagePlus className="w-4 h-4" /> Storefront Banner

          </h3>



          <div className="mt-4 flex flex-col sm:flex-row gap-5">

            <div className="relative w-36 shrink-0 aspect-[3/4] overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">

              {profile.bannerAsset?.publicUrl ? (

                <Image

                  src={profile.bannerAsset.publicUrl}

                  alt="Your storefront banner"

                  fill

                  sizes="144px"

                  className="object-cover object-top"

                />

              ) : (

                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-3 text-center text-stone-400">

                  <ImagePlus className="w-5 h-5" />

                  <span className="text-[10px] leading-snug">No banner set</span>

                </div>

              )}

            </div>



            <div className="flex-1 min-w-0 space-y-3">

              <p className="text-stone-600 leading-relaxed">

                This image is the background of your tile in the "Our trusted vendors" section on the

                homepage.{' '}

                {!profile.bannerAsset && 'Until you add one, your latest product photo is shown instead.'}

              </p>



              <ul className="text-stone-500 space-y-1 list-disc pl-4">

                <li>JPG, PNG or WebP, up to 8 MB</li>

                <li>Portrait or square works best (around 1200 × 1400 px)</li>

                <li>Keep the subject in the upper two-thirds; your name panel covers the bottom</li>

              </ul>



              <div className="flex flex-wrap gap-2 pt-1">

                <input

                  ref={bannerInputRef}

                  type="file"

                  accept="image/jpeg,image/png,image/webp"

                  className="hidden"

                  onChange={handleBannerSelect}

                />

                <button

                  type="button"

                  disabled={bannerBusy}

                  onClick={() => bannerInputRef.current?.click()}

                  className="px-4 py-2.5 bg-[#831843] hover:bg-rose-900 text-white rounded-xl font-bold text-xs shadow transition flex items-center gap-2 disabled:opacity-60"

                >

                  <ImagePlus className="w-3.5 h-3.5" />

                  <span>{bannerBusy ? 'Working...' : profile.bannerAsset ? 'Replace Banner' : 'Upload Banner'}</span>

                </button>



                {profile.bannerAsset && (

                  <button

                    type="button"

                    disabled={bannerBusy}

                    onClick={handleBannerRemove}

                    className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold text-xs transition flex items-center gap-2 disabled:opacity-60"

                  >

                    <Trash2 className="w-3.5 h-3.5" />

                    <span>Remove</span>

                  </button>

                )}

              </div>

            </div>

          </div>

        </div>



        <form onSubmit={handleSave} className="space-y-6 text-xs">



          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">

            <h3 className="font-serif text-base font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">

              <User className="w-4 h-4" /> Contact Details

            </h3>

            <div className="grid grid-cols-2 gap-4">

              <div>

                <label className="block font-semibold text-stone-700 mb-1">Contact Name</label>

                <input

                  type="text"

                  disabled={!isEditing}

                  value={form.contactName}

                  onChange={e => setForm({ ...form, contactName: e.target.value })}

                  className={fieldClass(isEditing)}

                />

              </div>

              <div>

                <label className="block font-semibold text-stone-700 mb-1">Mobile Number</label>

                <input

                  type="tel"

                  disabled={!isEditing}

                  value={form.mobile}

                  onChange={e => setForm({ ...form, mobile: e.target.value })}

                  className={fieldClass(isEditing)}

                />

              </div>

            </div>

          </div>



          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">

            <h3 className="font-serif text-base font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">

              <MapPin className="w-4 h-4" /> Business Address

            </h3>

            <div className="space-y-4">

              <div>

                <label className="block font-semibold text-stone-700 mb-1">Address</label>

                <input

                  type="text"

                  disabled={!isEditing}

                  value={form.address}

                  onChange={e => setForm({ ...form, address: e.target.value })}

                  className={fieldClass(isEditing)}

                />

              </div>

              <div className="grid grid-cols-3 gap-4">

                <div>

                  <label className="block font-semibold text-stone-700 mb-1">City</label>

                  <input

                    type="text"

                    disabled={!isEditing}

                    value={form.city}

                    onChange={e => setForm({ ...form, city: e.target.value })}

                    className={fieldClass(isEditing)}

                  />

                </div>

                <div>

                  <label className="block font-semibold text-stone-700 mb-1">State</label>

                  <input

                    type="text"

                    disabled={!isEditing}

                    value={form.state}

                    onChange={e => setForm({ ...form, state: e.target.value })}

                    className={fieldClass(isEditing)}

                  />

                </div>

                <div>

                  <label className="block font-semibold text-stone-700 mb-1">State Code</label>

                  <input

                    type="text"

                    maxLength={2}

                    disabled={!isEditing}

                    value={form.stateCode}

                    onChange={e => setForm({ ...form, stateCode: e.target.value })}

                    className={`${fieldClass(isEditing)} font-mono`}

                  />

                </div>

              </div>

            </div>

          </div>



          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">

            <h3 className="font-serif text-base font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">

              <CreditCard className="w-4 h-4" /> Payout Bank Details

            </h3>

            <div className="grid grid-cols-2 gap-4">

              <div>

                <label className="block font-semibold text-stone-700 mb-1">Bank Name</label>

                <input

                  type="text"

                  disabled={!isEditing}

                  value={form.bankName}

                  onChange={e => setForm({ ...form, bankName: e.target.value })}

                  className={fieldClass(isEditing)}

                />

              </div>

              <div>

                <label className="block font-semibold text-stone-700 mb-1">Account Holder Name</label>

                <input

                  type="text"

                  disabled={!isEditing}

                  value={form.accountHolder}

                  onChange={e => setForm({ ...form, accountHolder: e.target.value })}

                  className={fieldClass(isEditing)}

                />

              </div>

              <div>

                <label className="block font-semibold text-stone-700 mb-1">Account Number</label>

                <input

                  type="text"

                  disabled={!isEditing}

                  value={form.accountNumber}

                  onChange={e => setForm({ ...form, accountNumber: e.target.value })}

                  className={`${fieldClass(isEditing)} font-mono`}

                />

              </div>

              <div>

                <label className="block font-semibold text-stone-700 mb-1">IFSC Code</label>

                <input

                  type="text"

                  maxLength={11}

                  disabled={!isEditing}

                  value={form.ifsc}

                  onChange={e => setForm({ ...form, ifsc: e.target.value.toUpperCase() })}

                  className={`${fieldClass(isEditing)} font-mono`}

                />

              </div>

              <div>

                <label className="block font-semibold text-stone-700 mb-1">Branch</label>

                <input

                  type="text"

                  disabled={!isEditing}

                  value={form.branch}

                  onChange={e => setForm({ ...form, branch: e.target.value })}

                  className={fieldClass(isEditing)}

                />

              </div>

              <div>

                <label className="block font-semibold text-stone-700 mb-1">UPI ID</label>

                <input

                  type="text"

                  disabled={!isEditing}

                  value={form.upiId}

                  onChange={e => setForm({ ...form, upiId: e.target.value })}

                  className={fieldClass(isEditing)}

                />

              </div>

            </div>

          </div>



          {isEditing && (

            <div className="flex gap-3">

              <button

                type="submit"

                disabled={saving}

                className="flex-1 py-3.5 bg-[#831843] hover:bg-rose-900 text-white rounded-xl font-bold shadow transition flex items-center justify-center gap-2 disabled:opacity-60"

              >

                <Save className="w-4 h-4" />

                <span>{saving ? 'Saving...' : 'Save Changes'}</span>

              </button>

              <button

                type="button"

                onClick={handleCancel}

                disabled={saving}

                className="px-6 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-60"

              >

                <X className="w-4 h-4" />

                <span>Cancel</span>

              </button>

            </div>

          )}

        </form>

        <form onSubmit={handleChangePassword} className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4 text-xs">

          <div className="flex items-center justify-between border-b border-stone-100 pb-2">

            <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">

              <Lock className="w-4 h-4" /> Login Password

            </h3>

            {!isChangingPassword && (

              <button

                type="button"

                onClick={() => setIsChangingPassword(true)}

                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg font-bold text-[11px] transition"

              >

                Change Password

              </button>

            )}

          </div>



          {isChangingPassword ? (

            <>

              <div>

                <label className="block font-semibold text-stone-700 mb-1">Current Password</label>

                <input

                  type="password"

                  required

                  value={passwordForm.oldPassword}

                  onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}

                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-900"

                />

              </div>

              <div className="grid grid-cols-2 gap-4">

                <div>

                  <label className="block font-semibold text-stone-700 mb-1">New Password</label>

                  <input

                    type="password"

                    required

                    minLength={8}

                    value={passwordForm.newPassword}

                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}

                    placeholder="Minimum 8 characters"

                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-900"

                  />

                </div>

                <div>

                  <label className="block font-semibold text-stone-700 mb-1">Confirm New Password</label>

                  <input

                    type="password"

                    required

                    value={passwordForm.confirmPassword}

                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}

                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-900"

                  />

                </div>

              </div>



              <div className="flex gap-3 pt-1">

                <button

                  type="submit"

                  disabled={changingPassword}

                  className="flex-1 py-2.5 bg-[#831843] hover:bg-rose-900 text-white rounded-xl font-bold shadow transition disabled:opacity-60"

                >

                  {changingPassword ? 'Updating...' : 'Update Password'}

                </button>

                <button

                  type="button"

                  onClick={handleCancelPasswordChange}

                  disabled={changingPassword}

                  className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold disabled:opacity-60"

                >

                  Cancel

                </button>

              </div>

            </>

          ) : (

            <p className="text-stone-500">Click "Change Password" to update your login credentials.</p>

          )}

        </form>

        </div>

      </main>

    </div>

  );

}



interface StaffBankDetails {

  bankName: string;

  accountHolder: string;

  accountNumber: string;

  ifsc: string;

  branch: string | null;

  upiId: string | null;

}



interface StaffProfileData {

  name: string;

  email: string;

  mobile: string | null;

  role: string;

  createdAt: string;

  lastLoginAt: string | null;

  isActive?: boolean;

  bankDetails: StaffBankDetails | null;

  mainStoreDescription: string;

}



function getInitials(name: string) {

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return '?';

  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();

}



function formatRoleLabel(role: string) {

  return role

    .toLowerCase()

    .split('_')

    .map(w => w.charAt(0).toUpperCase() + w.slice(1))

    .join(' ');

}



function roleBadgeClass(role: string) {

  switch (role) {

    case 'SUPER_ADMIN':

      return 'bg-rose-900 text-white';

    case 'ADMIN':

      return 'bg-[#831843] text-white';

    case 'OPERATIONS_MANAGER':

      return 'bg-amber-100 text-amber-800 border border-amber-200';

    default:

      return 'bg-stone-200 text-stone-700';

  }

}



function daysSince(dateStr: string) {

  const then = new Date(dateStr).getTime();

  const now = Date.now();

  const days = Math.max(0, Math.floor((now - then) / (1000 * 60 * 60 * 24)));

  return days;

}



function formatTenure(dateStr: string) {

  const days = daysSince(dateStr);

  if (days < 1) return 'Joined today';

  if (days < 30) return `${days} day${days === 1 ? '' : 's'} on staff`;

  const months = Math.floor(days / 30);

  if (months < 12) return `${months} month${months === 1 ? '' : 's'} on staff`;

  const years = Math.floor(months / 12);

  const remMonths = months % 12;

  return `${years} yr${years === 1 ? '' : 's'}${remMonths ? ` ${remMonths} mo` : ''} on staff`;

}



function StaffProfilePage() {

  const { addToast } = useApp();

  const [profile, setProfile] = useState<StaffProfileData | null>(null);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [isEditing, setIsEditing] = useState(false);

  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [changingPassword, setChangingPassword] = useState(false);



  const [passwordForm, setPasswordForm] = useState({

    oldPassword: '',

    newPassword: '',

    confirmPassword: '',

  });



  const [form, setForm] = useState({

    name: '',

    email: '',

    mobile: '',

    bankName: '',

    accountHolder: '',

    accountNumber: '',

    ifsc: '',

    branch: '',

    upiId: '',

    mainStoreDescription: '',

  });



  const buildFormFromProfile = (data: StaffProfileData) => ({

    name: data.name || '',

    email: data.email || '',

    mobile: data.mobile || '',

    bankName: data.bankDetails?.bankName || '',

    accountHolder: data.bankDetails?.accountHolder || '',

    accountNumber: data.bankDetails?.accountNumber || '',

    ifsc: data.bankDetails?.ifsc || '',

    branch: data.bankDetails?.branch || '',

    upiId: data.bankDetails?.upiId || '',

    mainStoreDescription: data.mainStoreDescription || '',

  });



  const loadProfile = async () => {

    setLoading(true);



    try {

      const res = await fetch('/api/admin/profile');

      const json = await res.json();



      if (json.success) {

        setProfile(json.data);

        setForm(buildFormFromProfile(json.data));

      } else {

        addToast({

          type: 'error',

          title: 'Failed to load profile',

          message: json.error,

        });

      }

    } catch {

      addToast({

        type: 'error',

        title: 'Network error',

        message: 'Could not load profile.',

      });

    } finally {

      setLoading(false);

    }

  };



  useEffect(() => {

    loadProfile();

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, []);



  const handleEdit = () => setIsEditing(true);



  const handleCancel = () => {

    if (profile) {

      setForm(buildFormFromProfile(profile));

    }

    setIsEditing(false);

  };



  const handleSave = async (e: React.FormEvent) => {

    e.preventDefault();

    setSaving(true);



    try {

      const res = await fetch('/api/admin/profile', {

        method: 'PATCH',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify(form),

      });



      const json = await res.json();



      if (json.success) {

        addToast({

          type: 'success',

          title: 'Profile Updated',

          message: 'Your details have been saved.',

        });



        await loadProfile();

        setIsEditing(false);

      } else {

        addToast({

          type: 'error',

          title: 'Update failed',

          message: json.error,

        });

      }

    } catch {

      addToast({

        type: 'error',

        title: 'Network error',

        message: 'Could not save changes.',

      });

    } finally {

      setSaving(false);

    }

  };



  const handleChangePassword = async (e: React.FormEvent) => {

    e.preventDefault();



    if (passwordForm.newPassword !== passwordForm.confirmPassword) {

      addToast({

        type: 'error',

        title: "Passwords don't match",

        message: 'New password and confirmation must match.',

      });

      return;

    }



    setChangingPassword(true);



    try {

      const res = await fetch('/api/admin/profile/password', {

        method: 'PATCH',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify(passwordForm),

      });



      const json = await res.json();



      if (json.success) {

        addToast({

          type: 'success',

          title: 'Password Changed',

          message: 'Use your new password next time you log in.',

        });



        setPasswordForm({

          oldPassword: '',

          newPassword: '',

          confirmPassword: '',

        });

        setIsChangingPassword(false);

      } else {

        addToast({

          type: 'error',

          title: 'Change failed',

          message: json.error,

        });

      }

    } catch {

      addToast({

        type: 'error',

        title: 'Network error',

        message: 'Could not change password.',

      });

    } finally {

      setChangingPassword(false);

    }

  };



  const handleCancelPasswordChange = () => {

    setPasswordForm({

      oldPassword: '',

      newPassword: '',

      confirmPassword: '',

    });

    setIsChangingPassword(false);

  };



  if (loading || !profile) {

    return (

      <div className="flex min-h-screen bg-[#faf8f5]">

        <AdminSidebar activeTab="profile" />

        <main className="flex-1 p-6 lg:p-10 flex items-center justify-center">

          <div className="flex items-center gap-2 text-xs text-stone-500">

            <span className="w-3.5 h-3.5 rounded-full border-2 border-stone-300 border-t-[#831843] animate-spin" />

            Loading profile...

          </div>

        </main>

      </div>

    );

  }



  const fieldClass = (editable: boolean) =>

    `w-full px-3 py-2 rounded-xl border focus:outline-none transition ${

      editable

        ? 'bg-stone-50 border-stone-300 focus:border-rose-900'

        : 'bg-stone-100 border-stone-200 text-stone-600 cursor-not-allowed'

    }`;



  const isActive = profile.isActive !== false;



  return (

    <div className="flex min-h-screen bg-[#faf8f5]">

      <AdminSidebar activeTab="profile" />



      <main className="flex-1 min-w-0 p-6 lg:p-10 overflow-y-auto">

        <div className="w-full max-w-3xl space-y-6">



          {/* Identity header */}

          <div className="relative overflow-hidden rounded-3xl border border-stone-200 shadow-sm">

            <div className="h-20 bg-gradient-to-r from-[#831843] via-rose-900 to-[#831843]" />



            <div className="bg-white px-6 pb-6">

              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-10">

                <div className="flex items-end gap-4">

                  <div className="w-20 h-20 rounded-2xl bg-stone-900 text-white flex items-center justify-center font-serif text-2xl font-bold shadow-lg ring-4 ring-white shrink-0">

                    {getInitials(profile.name)}

                  </div>



                  <div className="pb-1">

                    <h1 className="font-serif text-2xl font-bold text-stone-900 leading-tight">

                      {profile.name}

                    </h1>



                    <div className="flex flex-wrap items-center gap-2 mt-1.5">

                      <span

                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${roleBadgeClass(profile.role)}`}

                      >

                        {formatRoleLabel(profile.role)}

                      </span>



                      <span

                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${

                          isActive

                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'

                            : 'bg-stone-100 text-stone-500 border border-stone-200'

                        }`}

                      >

                        {isActive ? (

                          <CheckCircle2 className="w-3 h-3" />

                        ) : (

                          <XCircle className="w-3 h-3" />

                        )}

                        {isActive ? 'Active' : 'Inactive'}

                      </span>

                    </div>

                  </div>

                </div>



                {!isEditing && (

                  <button

                    type="button"

                    onClick={handleEdit}

                    className="px-4 py-2.5 bg-[#831843] hover:bg-rose-900 text-white rounded-xl font-bold text-xs shadow transition flex items-center gap-2 shrink-0"

                  >

                    <Pencil className="w-3.5 h-3.5" />

                    <span>Edit Details</span>

                  </button>

                )}

              </div>

            </div>

          </div>



          {/* Quick stats */}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">

            <div className="bg-white rounded-2xl border border-stone-200 p-4 flex items-start gap-3">

              <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">

                <CalendarClock className="w-4 h-4 text-[#831843]" />

              </div>



              <div>

                <span className="text-[10px] uppercase font-bold text-stone-400 block">

                  Staff Since

                </span>

                <span className="font-semibold text-stone-800">

                  {new Date(profile.createdAt).toLocaleDateString('en-IN', {

                    dateStyle: 'medium',

                  })}

                </span>

                <span className="block text-[10px] text-stone-400 mt-0.5">

                  {formatTenure(profile.createdAt)}

                </span>

              </div>

            </div>



            <div className="bg-white rounded-2xl border border-stone-200 p-4 flex items-start gap-3">

              <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">

                <Clock className="w-4 h-4 text-[#831843]" />

              </div>



              <div>

                <span className="text-[10px] uppercase font-bold text-stone-400 block">

                  Last Login

                </span>

                <span className="font-semibold text-stone-800">

                  {profile.lastLoginAt

                    ? new Date(profile.lastLoginAt).toLocaleString('en-IN', {

                        dateStyle: 'medium',

                        timeStyle: 'short',

                      })

                    : 'Never logged in'}

                </span>

              </div>

            </div>



            <div className="bg-white rounded-2xl border border-stone-200 p-4 flex items-start gap-3 col-span-2 sm:col-span-1">

              <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">

                <Shield className="w-4 h-4 text-[#831843]" />

              </div>



              <div>

                <span className="text-[10px] uppercase font-bold text-stone-400 block">

                  Access Level

                </span>

                <span className="font-semibold text-stone-800">

                  {formatRoleLabel(profile.role)}

                </span>

              </div>

            </div>

          </div>



          {/* Editable personal details */}

          <form

            onSubmit={handleSave}

            className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4 text-xs"

          >

            <h3 className="font-serif text-base font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">

              <User className="w-4 h-4" /> Personal Details

            </h3>



            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>

                <label className="block font-semibold text-stone-700 mb-1">

                  Full Name

                </label>

                <input

                  type="text"

                  required

                  disabled={!isEditing}

                  value={form.name}

                  onChange={e => setForm({ ...form, name: e.target.value })}

                  className={fieldClass(isEditing)}

                />

              </div>



              <div>

                <label className="block font-semibold text-stone-700 mb-1">

                  Email Address

                </label>

                <input

                  type="email"

                  required

                  disabled={!isEditing}

                  value={form.email}

                  onChange={e => setForm({ ...form, email: e.target.value })}

                  className={fieldClass(isEditing)}

                />

              </div>



              <div>

                <label className="block font-semibold text-stone-700 mb-1">

                  Mobile Number

                </label>

                <input

                  type="tel"

                  disabled={!isEditing}

                  value={form.mobile}

                  onChange={e => setForm({ ...form, mobile: e.target.value })}

                  className={fieldClass(isEditing)}

                />

              </div>

            </div>



            {isEditing && (

              <div className="flex gap-3 pt-2">

                <button

                  type="submit"

                  disabled={saving}

                  className="flex-1 py-3.5 bg-[#831843] hover:bg-rose-900 text-white rounded-xl font-bold shadow transition flex items-center justify-center gap-2 disabled:opacity-60"

                >

                  <Save className="w-4 h-4" />

                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>

                </button>



                <button

                  type="button"

                  onClick={handleCancel}

                  disabled={saving}

                  className="px-6 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-60"

                >

                  <X className="w-4 h-4" />

                  <span>Cancel</span>

                </button>

              </div>

            )}

          </form>



          {/* Iccha Main Store description */}
          <form
            onSubmit={handleSave}
            className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4 text-xs"
          >
            <h3 className="font-serif text-base font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Iccha Main Store
            </h3>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Description shown in &quot;A sample of what we make&quot;
              </label>
              <textarea
                rows={5}
                maxLength={2000}
                disabled={!isEditing}
                value={form.mainStoreDescription}
                onChange={e =>
                  setForm({ ...form, mainStoreDescription: e.target.value })
                }
                placeholder="Describe what Iccha Main Store makes, the designs, materials, craftsmanship, or manufacturing speciality..."
                className={`${fieldClass(isEditing)} resize-y min-h-[130px]`}
              />
              <p className="mt-1.5 text-[11px] text-stone-400">
                Up to 2,000 characters. This appears directly below Iccha Main Store on the homepage.
              </p>
            </div>

            {isEditing && (
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3.5 bg-[#831843] hover:bg-rose-900 text-white rounded-xl font-bold shadow transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Store Description'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-6 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </form>

          {/* Individual staff bank details */}

          <form

            onSubmit={handleSave}

            className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4 text-xs"

          >

            <h3 className="font-serif text-base font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">

              <CreditCard className="w-4 h-4" /> Bank Details

            </h3>



            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>

                <label className="block font-semibold text-stone-700 mb-1">

                  Bank Name

                </label>

                <input

                  type="text"

                  disabled={!isEditing}

                  value={form.bankName}

                  onChange={e => setForm({ ...form, bankName: e.target.value })}

                  className={fieldClass(isEditing)}

                />

              </div>



              <div>

                <label className="block font-semibold text-stone-700 mb-1">

                  Account Holder Name

                </label>

                <input

                  type="text"

                  disabled={!isEditing}

                  value={form.accountHolder}

                  onChange={e =>

                    setForm({ ...form, accountHolder: e.target.value })

                  }

                  className={fieldClass(isEditing)}

                />

              </div>



              <div>

                <label className="block font-semibold text-stone-700 mb-1">

                  Account Number

                </label>

                <input

                  type="text"

                  disabled={!isEditing}

                  value={form.accountNumber}

                  onChange={e =>

                    setForm({ ...form, accountNumber: e.target.value })

                  }

                  className={`${fieldClass(isEditing)} font-mono`}

                />

              </div>



              <div>

                <label className="block font-semibold text-stone-700 mb-1">

                  IFSC Code

                </label>

                <input

                  type="text"

                  maxLength={11}

                  disabled={!isEditing}

                  value={form.ifsc}

                  onChange={e =>

                    setForm({ ...form, ifsc: e.target.value.toUpperCase() })

                  }

                  className={`${fieldClass(isEditing)} font-mono`}

                />

              </div>



              <div>

                <label className="block font-semibold text-stone-700 mb-1">

                  Branch

                </label>

                <input

                  type="text"

                  disabled={!isEditing}

                  value={form.branch}

                  onChange={e => setForm({ ...form, branch: e.target.value })}

                  className={fieldClass(isEditing)}

                />

              </div>



              <div>

                <label className="block font-semibold text-stone-700 mb-1">

                  UPI ID

                </label>

                <input

                  type="text"

                  disabled={!isEditing}

                  value={form.upiId}

                  onChange={e => setForm({ ...form, upiId: e.target.value })}

                  className={fieldClass(isEditing)}

                />

              </div>

            </div>



            {isEditing && (

              <>

                <div className="pt-2 text-[11px] text-stone-500">

                  Bank details belong to your individual staff account and are

                  separate from the company billing entity.

                </div>



                <div className="flex gap-3 pt-2">

                  <button

                    type="submit"

                    disabled={saving}

                    className="flex-1 py-3.5 bg-[#831843] hover:bg-rose-900 text-white rounded-xl font-bold shadow transition flex items-center justify-center gap-2 disabled:opacity-60"

                  >

                    <Save className="w-4 h-4" />

                    <span>{saving ? 'Saving...' : 'Save Bank Details'}</span>

                  </button>



                  <button

                    type="button"

                    onClick={handleCancel}

                    disabled={saving}

                    className="px-6 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-60"

                  >

                    <X className="w-4 h-4" />

                    <span>Cancel</span>

                  </button>

                </div>

              </>

            )}

          </form>



          {/* Password */}

          <form

            onSubmit={handleChangePassword}

            className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4 text-xs"

          >

            <div className="flex items-center justify-between border-b border-stone-100 pb-2">

              <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">

                <Lock className="w-4 h-4" /> Login Password

              </h3>



              {!isChangingPassword && (

                <button

                  type="button"

                  onClick={() => setIsChangingPassword(true)}

                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg font-bold text-[11px] transition"

                >

                  Change Password

                </button>

              )}

            </div>



            {isChangingPassword ? (

              <>

                <div>

                  <label className="block font-semibold text-stone-700 mb-1">

                    Current Password

                  </label>

                  <input

                    type="password"

                    required

                    value={passwordForm.oldPassword}

                    onChange={e =>

                      setPasswordForm({

                        ...passwordForm,

                        oldPassword: e.target.value,

                      })

                    }

                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-900"

                  />

                </div>



                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <div>

                    <label className="block font-semibold text-stone-700 mb-1">

                      New Password

                    </label>

                    <input

                      type="password"

                      required

                      minLength={8}

                      value={passwordForm.newPassword}

                      onChange={e =>

                        setPasswordForm({

                          ...passwordForm,

                          newPassword: e.target.value,

                        })

                      }

                      placeholder="Minimum 8 characters"

                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-900"

                    />

                  </div>



                  <div>

                    <label className="block font-semibold text-stone-700 mb-1">

                      Confirm New Password

                    </label>

                    <input

                      type="password"

                      required

                      value={passwordForm.confirmPassword}

                      onChange={e =>

                        setPasswordForm({

                          ...passwordForm,

                          confirmPassword: e.target.value,

                        })

                      }

                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-rose-900"

                    />

                  </div>

                </div>



                <div className="flex gap-3 pt-1">

                  <button

                    type="submit"

                    disabled={changingPassword}

                    className="flex-1 py-2.5 bg-[#831843] hover:bg-rose-900 text-white rounded-xl font-bold shadow transition disabled:opacity-60"

                  >

                    {changingPassword ? 'Updating...' : 'Update Password'}

                  </button>



                  <button

                    type="button"

                    onClick={handleCancelPasswordChange}

                    disabled={changingPassword}

                    className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold disabled:opacity-60"

                  >

                    Cancel

                  </button>

                </div>

              </>

            ) : (

              <p className="text-stone-500">

                Click "Change Password" to update your login credentials.

              </p>

            )}

          </form>

        </div>

      </main>

    </div>

  );

}


