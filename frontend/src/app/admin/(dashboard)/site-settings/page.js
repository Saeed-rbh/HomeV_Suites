"use client";

import { useState, useEffect } from "react";
import { Save, Plus, Trash2, GripVertical, LoaderCircle, Check, Globe } from "lucide-react";

const PLATFORMS = ["Instagram", "Facebook", "Twitter/X", "TikTok", "YouTube", "LinkedIn", "WhatsApp", "Custom"];

export default function SiteSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Form state
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [socialLinks, setSocialLinks] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') + '/settings');
            const data = await res.json();
            if (data.success && data.data) {
                setEmail(data.data.contact_email || "");
                setPhone(data.data.contact_phone || "");
                setAddress(data.data.contact_address || "");
                setSocialLinks(data.data.social_links || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        const token = localStorage.getItem("adminToken");
        
        try {
            const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') + '/settings', {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    contact_email: email,
                    contact_phone: phone,
                    contact_address: address,
                    social_links: socialLinks.filter(link => link.url.trim() !== "")
                })
            });
            const data = await res.json();
            if (data.success) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (e) {
            console.error(e);
        }
        setSaving(false);
    };

    const addSocialLink = () => {
        setSocialLinks([...socialLinks, { platform: "Instagram", url: "", label: "" }]);
    };

    const removeSocialLink = (index) => {
        setSocialLinks(socialLinks.filter((_, i) => i !== index));
    };

    const updateSocialLink = (index, field, value) => {
        const newLinks = [...socialLinks];
        newLinks[index][field] = value;
        // Auto-set label if empty and platform changes
        if (field === "platform" && !newLinks[index].label) {
            newLinks[index].label = value !== "Custom" ? value : "";
        }
        setSocialLinks(newLinks);
    };

    const moveSocialLink = (index, direction) => {
        if ((direction === -1 && index === 0) || (direction === 1 && index === socialLinks.length - 1)) return;
        const newLinks = [...socialLinks];
        const temp = newLinks[index];
        newLinks[index] = newLinks[index + direction];
        newLinks[index + direction] = temp;
        setSocialLinks(newLinks);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoaderCircle className="h-8 w-8 animate-spin text-[#0c1929]" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#0c1929]">Contact & Social Settings</h1>
                <p className="mt-1 text-sm text-slate-600">Update the public contact information and social media links displayed on the website.</p>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-[#0c1929] mb-4">Contact Information</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#0c1929] mb-1.5">Public Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="support@homev.ca"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-[#0c1929] focus:ring-1 focus:ring-[#0c1929] transition"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#0c1929] mb-1.5">Public Phone Number</label>
                        <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+1 (888) 123-4567"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-[#0c1929] focus:ring-1 focus:ring-[#0c1929] transition"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#0c1929] mb-1.5">Physical Address / Location</label>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Toronto, ON, Canada"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-[#0c1929] focus:ring-1 focus:ring-[#0c1929] transition"
                        />
                    </div>
                </div>
            </div>

            {/* Social Links */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-[#0c1929]">Social Media Links</h2>
                    <button
                        onClick={addSocialLink}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#0c1929] bg-slate-100 rounded-lg hover:bg-slate-200 transition"
                    >
                        <Plus className="w-4 h-4" /> Add Link
                    </button>
                </div>
                
                <div className="space-y-3">
                    {socialLinks.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-6 border border-dashed border-slate-200 rounded-xl">No social links added yet.</p>
                    ) : (
                        socialLinks.map((link, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                                <div className="flex flex-col gap-1 pt-1">
                                    <button onClick={() => moveSocialLink(idx, -1)} disabled={idx === 0} className="text-slate-400 hover:text-[#0c1929] disabled:opacity-30">▲</button>
                                    <button onClick={() => moveSocialLink(idx, 1)} disabled={idx === socialLinks.length - 1} className="text-slate-400 hover:text-[#0c1929] disabled:opacity-30">▼</button>
                                </div>
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <select
                                        value={link.platform}
                                        onChange={(e) => updateSocialLink(idx, "platform", e.target.value)}
                                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0c1929]"
                                    >
                                        {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                    <input
                                        type="text"
                                        value={link.label}
                                        onChange={(e) => updateSocialLink(idx, "label", e.target.value)}
                                        placeholder="Display Label (e.g. @homev)"
                                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0c1929]"
                                    />
                                    <input
                                        type="url"
                                        value={link.url}
                                        onChange={(e) => updateSocialLink(idx, "url", e.target.value)}
                                        placeholder="https://..."
                                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0c1929]"
                                    />
                                </div>
                                <button
                                    onClick={() => removeSocialLink(idx)}
                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Save Action */}
            <div className="flex justify-end pt-4">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0c1929] px-8 py-3 text-sm font-semibold text-white shadow-md shadow-[#0c1929]/20 transition hover:bg-[#152b47] disabled:opacity-60"
                >
                    {saving ? (
                        <><LoaderCircle className="h-4 w-4 animate-spin" /> Saving...</>
                    ) : saved ? (
                        <><Check className="h-4 w-4" /> Saved!</>
                    ) : (
                        <><Save className="h-4 w-4" /> Save Settings</>
                    )}
                </button>
            </div>
        </div>
    );
}
