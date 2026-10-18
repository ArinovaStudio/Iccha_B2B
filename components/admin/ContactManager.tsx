"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";

const API = "/api/public/contact";

type Contact = {
  id: string;
  name: string;
  tag?: string | null;
  contactPerson?: string | null;
  phone: string;
  altPhone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  addressLine: string;
  city: string;
  state?: string | null;
  pincode?: string | null;
  mapUrl?: string | null;
  hours?: string | null;
  closedDays?: string | null;
  sortOrder: number;
  isActive: boolean;
};

type FormState = {
  name: string;
  tag: string;
  contactPerson: string;
  phone: string;
  altPhone: string;
  whatsapp: string;
  email: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  mapUrl: string;
  hours: string;
  closedDays: string;
  sortOrder: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  name: "", tag: "", contactPerson: "", phone: "", altPhone: "", whatsapp: "", email: "",
  addressLine: "", city: "", state: "", pincode: "", mapUrl: "", hours: "", closedDays: "",
  sortOrder: "", isActive: true,
};

function toForm(c: Contact): FormState {
  return {
    name: c.name, tag: c.tag ?? "", contactPerson: c.contactPerson ?? "", phone: c.phone,
    altPhone: c.altPhone ?? "", whatsapp: c.whatsapp ?? "", email: c.email ?? "",
    addressLine: c.addressLine, city: c.city, state: c.state ?? "", pincode: c.pincode ?? "",
    mapUrl: c.mapUrl ?? "", hours: c.hours ?? "", closedDays: c.closedDays ?? "",
    sortOrder: String(c.sortOrder), isActive: c.isActive,
  };
}

function extractErrors(e: unknown): string[] {
  if (axios.isAxiosError(e)) {
    const d = e.response?.data;
    if (Array.isArray(d?.errors)) return d.errors;
    if (d?.error) return [d.error];
    return [e.message];
  }
  return ["Something went wrong."];
}

/* ---------------------------- small pieces ------------------------------ */

const inputClass =
  "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400";

function Field({
  label, name, value, onChange, required, placeholder, hint, type = "text", disabled,
}: {
  label: string;
  name: keyof FormState;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-stone-700">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClass}
      />
      {hint && <span className="mt-1 block text-xs text-stone-500">{hint}</span>}
    </label>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-1 text-sm font-semibold text-stone-900">{title}</legend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

/* -------------------------------- page ----------------------------------- */

export default function ContactManager() {
  const [items, setItems] = useState<Contact[]>([]);
  const [max, setMax] = useState(3);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get(API, { params: { all: 1 } });
      setItems(data.data ?? []);
      if (typeof data.max === "number") setMax(data.max);
      setLoadError("");
    } catch (e) {
      setLoadError(extractErrors(e)[0]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const atLimit = !editingId && items.length >= max;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function reset() {
    setForm(emptyForm);
    setEditingId(null);
    setErrors([]);
  }

  function startEdit(c: Contact) {
    setForm(toForm(c));
    setEditingId(c.id);
    setErrors([]);
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (atLimit) return;

    setSaving(true);
    setErrors([]);
    setNotice("");

    const { sortOrder, ...rest } = form;
    const payload = { ...rest, ...(sortOrder.trim() ? { sortOrder: Number(sortOrder) } : {}) };

    try {
      if (editingId) await axios.patch(API, { id: editingId, ...payload });
      else await axios.post(API, payload);

      setNotice(editingId ? "Contact updated." : "Contact added.");
      reset();
      await load();
    } catch (err) {
      setErrors(extractErrors(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c: Contact) {
    if (!window.confirm(`Delete "${c.name}"? This cannot be undone.`)) return;
    setNotice("");
    try {
      await axios.delete(API, { params: { id: c.id } });
      if (editingId === c.id) reset();
      setNotice("Contact deleted.");
      await load();
    } catch (err) {
      setErrors(extractErrors(err));
    }
  }

  return (
    <div className="text-stone-800">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Contact cards</h1>
          <p className="mt-1 text-sm text-stone-600">
            These appear on the public contact page. You can have up to {max}.
          </p>
        </div>
        <p
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            items.length >= max ? "bg-amber-100 text-amber-800" : "bg-stone-100 text-stone-700"
          }`}
        >
          {items.length} of {max} used
        </p>
      </header>

      {loadError && (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {loadError}
        </p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        {/* ------------------------- Existing cards ------------------------- */}
        <section aria-label="Saved contact cards" className="space-y-3">
          {loading && <p className="text-sm text-stone-500">Loading…</p>}

          {!loading && !items.length && !loadError && (
            <p className="rounded-md border border-dashed border-stone-300 p-5 text-sm text-stone-500">
              No contact cards yet. Fill in the form to add the first one.
            </p>
          )}

          {items.map((c) => (
            <article
              key={c.id}
              className={`rounded-lg border p-4 ${
                editingId === c.id ? "border-stone-900 bg-stone-50" : "border-stone-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-medium text-stone-900">{c.name}</h2>
                  <p className="text-sm text-stone-600">
                    {c.city}
                    {c.tag ? ` · ${c.tag}` : ""}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-sm text-stone-600">{c.phone}</p>
              {c.email && <p className="text-sm text-stone-600">{c.email}</p>}

              <div className="mt-3 flex gap-4 text-sm">
                <button type="button" onClick={() => startEdit(c)} className="font-medium text-stone-900 underline-offset-4 hover:underline">
                  Edit
                </button>
                <button type="button" onClick={() => handleDelete(c)} className="font-medium text-red-700 underline-offset-4 hover:underline">
                  Delete
                </button>
              </div>
            </article>
          ))}
        </section>

        {/* ------------------------------ Form ------------------------------ */}
        <section aria-label="Contact form" className="rounded-lg border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-stone-900">
            {editingId ? "Edit contact card" : "Add contact card"}
          </h2>

          {atLimit && (
            <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="status">
              You&rsquo;ve reached the limit of {max} cards. Edit or delete one to add another.
            </p>
          )}

          {notice && (
            <p className="mt-3 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800" role="status">
              {notice}
            </p>
          )}

          {errors.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 rounded-md border border-red-200 bg-red-50 py-3 pl-8 pr-4 text-sm text-red-700" role="alert">
              {errors.map((er) => (
                <li key={er}>{er}</li>
              ))}
            </ul>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-7">
            <Group title="Card heading">
              <Field label="Name" name="name" value={form.name} onChange={handleChange} required disabled={atLimit} placeholder="Mumbai Showroom" />
              <Field label="Label" name="tag" value={form.tag} onChange={handleChange} disabled={atLimit} placeholder="Head office" hint="Small text above the name." />
              <Field label="Contact person" name="contactPerson" value={form.contactPerson} onChange={handleChange} disabled={atLimit} placeholder="Rahul Sharma" />
            </Group>

            <Group title="Phone & email">
              <Field label="Phone" name="phone" type="tel" value={form.phone} onChange={handleChange} required disabled={atLimit} placeholder="+91 98765 43210" />
              <Field label="Alternate phone" name="altPhone" type="tel" value={form.altPhone} onChange={handleChange} disabled={atLimit} />
              <Field label="WhatsApp number" name="whatsapp" type="tel" value={form.whatsapp} onChange={handleChange} disabled={atLimit} placeholder="919876543210" hint="With country code. Leave empty to hide the button." />
              <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} disabled={atLimit} placeholder="mumbai@example.com" />
            </Group>

            <Group title="Address">
              <div className="sm:col-span-2">
                <Field label="Address line" name="addressLine" value={form.addressLine} onChange={handleChange} required disabled={atLimit} placeholder="Shop No. 12, Example Market, Dadar" />
              </div>
              <Field label="City" name="city" value={form.city} onChange={handleChange} required disabled={atLimit} />
              <Field label="State" name="state" value={form.state} onChange={handleChange} disabled={atLimit} />
              <Field label="Pincode" name="pincode" value={form.pincode} onChange={handleChange} disabled={atLimit} />
              <Field label="Google Maps link" name="mapUrl" type="url" value={form.mapUrl} onChange={handleChange} disabled={atLimit} placeholder="https://maps.google.com/…" hint="Must start with https://" />
            </Group>

            <Group title="Hours & display">
              <Field label="Opening hours" name="hours" value={form.hours} onChange={handleChange} disabled={atLimit} placeholder="Mon–Sat, 10:30 am – 7:30 pm" />
              <Field label="Closed days" name="closedDays" value={form.closedDays} onChange={handleChange} disabled={atLimit} placeholder="Sunday closed" />
              <Field label="Display order" name="sortOrder" type="number" value={form.sortOrder} onChange={handleChange} disabled={atLimit} placeholder="1" hint="Lowest number shows first." />
              <label className="flex items-center gap-2 self-end pb-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  disabled={atLimit}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-stone-300"
                />
                Show on website
              </label>
            </Group>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={saving || atLimit}
                className="rounded-md bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving…" : editingId ? "Save changes" : "Add contact"}
              </button>
              {editingId && (
                <button type="button" onClick={reset} className="text-sm font-medium text-stone-700 underline-offset-4 hover:underline">
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}