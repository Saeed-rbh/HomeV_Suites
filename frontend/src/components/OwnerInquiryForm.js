"use client";

import { useEffect, useState } from "react";
import { Send } from "lucide-react";

const PROPERTY_TYPES = ["Condo", "House", "Townhouse", "Other"];
const SIZES = ["Studio", "1 bedroom", "1 bedroom + den", "2 bedrooms", "3+ bedrooms"];

// Owners already have a property; investors may still be shopping for one
const VARIANTS = {
  owner: {
    subject: "Property management inquiry",
    addressLabel: "Property address",
    addressPlaceholder: "Street, unit number, city",
    addressRequired: true,
    planLabel: "What are you looking for?",
    plans: ["Long-term tenant management", "Furnished mid-term rentals (28+ nights)", "Short-term rental management", "Not sure, help me choose"],
    extras: [
      { key: "furnished", label: "Is it furnished?", options: ["Yes", "Partially", "No"] },
      { key: "status", label: "Right now it is", options: ["Vacant", "Tenant in place", "Rented short-term by me", "My own residence"] },
      { key: "timeline", label: "When would you like to start?", options: ["As soon as possible", "In 1–3 months", "In 3+ months", "Just exploring"], wide: true },
    ],
    messagePlaceholder: "Building amenities, parking, your goals…",
    button: "Request my free assessment",
  },
  investor: {
    subject: "Investor inquiry",
    addressLabel: "Property address or listing link",
    addressPlaceholder: "If you have one in mind",
    addressRequired: false,
    planLabel: "What can we help with?",
    plans: ["Pre-purchase rental analysis", "BRRRR: renovate, rent and refinance", "Adding a unit (basement, garden or laneway suite)", "Management after I buy", "Not sure yet"],
    extras: [
      { key: "stage", label: "Where are you in buying?", options: ["Just researching", "Looking at specific properties", "Offer in progress", "Already bought"], wide: true },
    ],
    messagePlaceholder: "Target areas, budget range, what you want the property to do for you…",
    button: "Request my analysis",
  },
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

function initialForm(config) {
  const form = { name: "", email: "", phone: "", address: "", plan: config.plans[0], propertyType: PROPERTY_TYPES[0], bedrooms: SIZES[1], message: "" };
  config.extras.forEach(({ key, options }) => { form[key] = options[0]; });
  return form;
}

export default function OwnerInquiryForm({ variant = "owner" }) {
  const config = VARIANTS[variant];
  const [form, setForm] = useState(() => initialForm(config));
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
      `${config.addressLabel}: ${form.address || "-"}`,
      `${config.planLabel} ${form.plan}`,
      `Property type: ${form.propertyType}`,
      `Size: ${form.bedrooms}`,
      ...config.extras.map(({ key, label }) => `${label} ${form[key]}`),
      "",
      form.message,
    ].join("\n");
    const subject = `${config.subject} - ${form.address || form.name}`;
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
        <Field label={config.addressLabel}>
          <input type="text" required={config.addressRequired} value={form.address} onChange={update("address")} className={inputClass} placeholder={config.addressPlaceholder} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label={config.planLabel}>
          <Select value={form.plan} onChange={update("plan")} options={config.plans} />
        </Field>
      </div>
      <Field label="Property type">
        <Select value={form.propertyType} onChange={update("propertyType")} options={PROPERTY_TYPES} />
      </Field>
      <Field label="Size">
        <Select value={form.bedrooms} onChange={update("bedrooms")} options={SIZES} />
      </Field>
      {config.extras.map(({ key, label, options, wide }) => (
        <div key={key} className={wide ? "sm:col-span-2" : ""}>
          <Field label={label}>
            <Select value={form[key]} onChange={update(key)} options={options} />
          </Field>
        </div>
      ))}
      <div className="sm:col-span-2">
        <Field label="Anything else we should know?">
          <textarea rows={4} value={form.message} onChange={update("message")} className={`${inputClass} resize-none`} placeholder={config.messagePlaceholder} />
        </Field>
      </div>
      <button
        type="submit"
        disabled={sent}
        className="sm:col-span-2 w-full py-4 rounded-[20px] bg-[#411F0F] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#472312] transition-all disabled:opacity-70 mt-2"
      >
        {sent ? "Opened your email app" : <><Send className="w-4 h-4" /> {config.button}</>}
      </button>
    </form>
  );
}
