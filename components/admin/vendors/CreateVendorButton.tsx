"use client";
import { useState, type FormEvent } from "react";
import { Plus, X, Loader2 } from "lucide-react";
type VendorFormData = {
  name: string;
  email: string;
  password: string;
  mobile: string;
  businessName: string;
  gstin: string;
  pan: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
  upiId: string;
};
const initialFormData: VendorFormData = {
  name: "",
  email: "",
  password: "",
  mobile: "",
  businessName: "",
  gstin: "",
  pan: "",
  address: "",
  city: "",
  state: "",
  stateCode: "",
  bankName: "",
  accountHolder: "",
  accountNumber: "",
  ifsc: "",
  branch: "",
  upiId: "",
};
const requiredFields: (keyof VendorFormData)[] = [
  "name",
  "email",
  "password",
  "mobile",
  "businessName",
  "gstin",
  "pan",
  "address",
  "city",
  "state",
  "stateCode",
];
type CreateVendorButtonProps = { onCreated?: () => void };
export default function CreateVendorButton({ onCreated }: CreateVendorButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] =
    useState<VendorFormData>(initialFormData);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  function updateField(
    field: keyof VendorFormData,
    value: string
  ) {
    setFormData((previous) => ({
      ...previous,
      [field]:
        field === "gstin" || field === "pan"
          ? value.toUpperCase()
          : value,
    }));
  }
  function closeModal() {
    if (isSubmitting) return;
    setIsOpen(false);
    setError("");
    setSuccess("");
  }
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    for (const field of requiredFields) {
      if (!formData[field].trim()) {
        setError("Please fill in all required fields.");
        return;
      }
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (formData.gstin.trim().length !== 15) {
      setError("GSTIN must contain exactly 15 characters.");
      return;
    }
    if (formData.pan.trim().length !== 10) {
      setError("PAN must contain exactly 10 characters.");
      return;
    }
    if (!/^[A-Z0-9]{15}$/.test(formData.gstin.trim())) {
      setError("GSTIN must contain only letters and numbers.");
      return;
    }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(formData.pan.trim())) {
      setError("Enter a valid PAN format, e.g. ABCDE1234F.");
      return;
    }
    if (formData.mobile.replace(/\D/g, "").length < 10) {
      setError("Enter a valid mobile number with at least 10 digits.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/vendors/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          email: formData.email.trim().toLowerCase(),
          name: formData.name.trim(),
          mobile: formData.mobile.trim(),
          businessName: formData.businessName.trim(),
          gstin: formData.gstin.trim().toUpperCase(),
          pan: formData.pan.trim().toUpperCase(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          stateCode: formData.stateCode.trim(),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Failed to create vendor account."
        );
      }
      setSuccess(
        `Vendor account created successfully for ${result.data.email}.`
      );
      setFormData(initialFormData);
      // Refresh the vendor list after a successful creation.
      window.dispatchEvent(new CustomEvent("vendor-created"));
      onCreated?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while creating the vendor."
      );
    } finally {
      setIsSubmitting(false);
    }
  }
  const inputClass =
    "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-rose-700 focus:ring-2 focus:ring-rose-100";
  const labelClass = "block text-sm font-medium text-gray-700";
  function renderField(
    field: keyof VendorFormData,
    label: string,
    options?: {
      type?: string;
      required?: boolean;
      maxLength?: number;
      placeholder?: string;
      autoComplete?: string;
    }
  ) {
    const required = options?.required ?? true;
    return (
      <div key={field}>
        <label htmlFor={field} className={labelClass}>
          {label}
          {required && <span className="ml-1 text-red-600">*</span>}
          {!required && (
            <span className="ml-1 text-gray-400">(Optional)</span>
          )}
        </label>
        <input
          id={field}
          name={field}
          type={options?.type ?? "text"}
          value={formData[field]}
          onChange={(event) =>
            updateField(field, event.target.value)
          }
          required={required}
          maxLength={options?.maxLength}
          placeholder={options?.placeholder}
          autoComplete={options?.autoComplete}
          className={inputClass}
        />
      </div>
    );
  }
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          setSuccess("");
          setIsOpen(true);
        }}
        className="inline-flex items-center gap-2 rounded-lg bg-rose-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-700 focus:ring-offset-2"
      >
        <Plus size={18} />
        Create Vendor
      </button>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-vendor-title"
            className="my-4 w-full max-w-4xl rounded-2xl bg-white shadow-xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b bg-white px-5 py-4 sm:px-7">
              <div>
                <h2
                  id="create-vendor-title"
                  className="text-xl font-semibold text-gray-900"
                >
                  Create Vendor Account
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Create an active vendor account directly.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                aria-label="Close dialog"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-7 px-5 py-6 sm:px-7">
                {error && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    {error}
                  </div>
                )}
                {success && (
                  <div
                    role="status"
                    className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
                  >
                    <p>{success}</p>
                    <p className="mt-1">
                      The account is active. You can close this form
                      or create another vendor.
                    </p>
                  </div>
                )}
                <section>
                  <h3 className="mb-4 text-base font-semibold text-gray-900">
                    Account Details
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {renderField("name", "Account Holder Name", {
                      autoComplete: "name",
                    })}
                    {renderField("email", "Email Address", {
                      type: "email",
                      autoComplete: "email",
                    })}
                    {renderField("password", "Password", {
                      type: "password",
                      autoComplete: "new-password",
                      placeholder: "At least 8 characters",
                    })}
                    {renderField("mobile", "Mobile Number", {
                      type: "tel",
                      autoComplete: "tel",
                      placeholder: "Enter mobile number",
                    })}
                  </div>
                </section>
                <section>
                  <h3 className="mb-4 text-base font-semibold text-gray-900">
                    Business and Tax Details
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      {renderField("businessName", "Business Name")}
                    </div>
                    {renderField("gstin", "GSTIN", {
                      maxLength: 15,
                      placeholder: "15 characters",
                    })}
                    {renderField("pan", "PAN", {
                      maxLength: 10,
                      placeholder: "ABCDE1234F",
                    })}
                  </div>
                </section>
                <section>
                  <h3 className="mb-4 text-base font-semibold text-gray-900">
                    Business Address
                  </h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      {renderField("address", "Full Address")}
                    </div>
                    {renderField("city", "City")}
                    {renderField("state", "State")}
                    {renderField("stateCode", "State Code")}
                  </div>
                </section>
                <section>
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-gray-900">
                      Bank Details
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      All bank details are optional.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {renderField("bankName", "Bank Name", {
                      required: false,
                    })}
                    {renderField("accountHolder", "Bank Account Holder", {
                      required: false,
                    })}
                    {renderField("accountNumber", "Account Number", {
                      required: false,
                    })}
                    {renderField("ifsc", "IFSC Code", {
                      required: false,
                    })}
                    {renderField("branch", "Bank Branch", {
                      required: false,
                    })}
                    {renderField("upiId", "UPI ID", {
                      required: false,
                    })}
                  </div>
                </section>
              </div>
              <div className="flex flex-col-reverse gap-3 rounded-b-2xl border-t bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting && (
                    <Loader2 size={17} className="animate-spin" />
                  )}
                  {isSubmitting ? "Creating..." : "Create Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
