"use client";

import { useEffect, useState } from "react";
import { Send } from "lucide-react";

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  address: "",
  propertyType: "Condo",
  bedrooms: "1 bedroom",
  furnished: "Yes",
  status: "Vacant",
  timeline: "As soon as possible",
  message: "",
};

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#411F0F] transition-all text-[15px] text-[#411F0F]";
const labelClass = "block text-sm font-medium text-[#411F0F] mb-1.5";

function Field({ label, children }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={onChange} className={`${inputClass} appearance-none`}>
      {options.map(option => <option key={option}>{option}</option>)}
    </select>
  );
}

export default function OwnerInquiryForm() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [targetEmail, setTargetEmail] = useState("support@homev.ca");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') + '/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.contact_email) setTargetEmail(data.data.contact_email);
      })
      .catch(() => {});
  }, []);

  const update = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // Same mailto approach as the contact page until there's an API endpoint for inquiries
    const body = [
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      `Phone: ${form.phone}`,
      `Property address: ${form.address}`,
      `Property type: ${form.propertyType}`,
      `Size: ${form.bedrooms}`,
      `Furnished: ${form.furnished}`,
      `Currently: ${form.status}`,
      `Looking to start: ${form.timeline}`,
      "",
      form.message,
    ].join("\n");
    const subject = `Property management inquiry - ${form.address || form.name}`;
    window.location.href = `mailto:${targetEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
    setTimeout(() => setSent(false), 5000);
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Full name">
        <input type="text" required value={form.name} onChange={update("name")} className={inputClass} placeholder="Your name" />
      </Field>
      <Field label="Phone">
        <input type="tel" required value={form.phone} onChange={update("phone")} className={inputClass} placeholder="(416) 000-0000" />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Email">
          <input type="email" required value={form.email} onChange={update("email")} className={inputClass} placeholder="your@email.com" />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Property address">
          <input type="text" required value={form.address} onChange={update("address")} className={inputClass} placeholder="Street, unit number, city" />
        </Field>
      </div>
      <Field label="Property type">
        <Select value={form.propertyType} onChange={update("propertyType")} options={["Condo", "House", "Townhouse", "Other"]} />
      </Field>
      <Field label="Size">
        <Select value={form.bedrooms} onChange={update("bedrooms")} options={["Studio", "1 bedroom", "1 bedroom + den", "2 bedrooms", "3+ bedrooms"]} />
      </Field>
      <Field label="Is it furnished?">
        <Select value={form.furnished} onChange={update("furnished")} options={["Yes", "Partially", "No"]} />
      </Field>
      <Field label="Right now it is">
        <Select value={form.status} onChange={update("status")} options={["Vacant", "Rented long-term", "Rented short-term by me", "My own residence"]} />
      </Field>
      <div className="sm:col-span-2">
        <Field label="When would you like to start?">
          <Select value={form.timeline} onChange={update("timeline")} options={["As soon as possible", "In 1–3 months", "In 3+ months", "Just exploring"]} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Anything else we should know?">
          <textarea rows={4} value={form.message} onChange={update("message")} className={`${inputClass} resize-none`} placeholder="Building amenities, parking, your goals…" />
        </Field>
      </div>
      <button
        type="submit"
        disabled={sent}
        className="sm:col-span-2 w-full py-4 rounded-[20px] bg-[#411F0F] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#472312] transition-all disabled:opacity-70 mt-2"
      >
        {sent ? "Opened your email app" : <><Send className="w-4 h-4" /> Request my free assessment</>}
      </button>
    </form>
  );
}
