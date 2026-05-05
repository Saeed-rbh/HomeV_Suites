"use client";

import { useState, useEffect, useRef } from "react";
import { Camera, Save, User, LoaderCircle, Check } from "lucide-react";

export default function SettingsPage() {
    const [profile, setProfile] = useState(null);
    const [displayName, setDisplayName] = useState("");
    const [bio, setBio] = useState("");
    const [phone, setPhone] = useState("");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem("adminToken");
        fetch("http://localhost:5000/api/admin/profile", {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    setProfile(data.data);
                    setDisplayName(data.data.displayName || "");
                    setBio(data.data.bio || "");
                    setPhone(data.data.phone || "");
                }
            })
            .catch(() => {});
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        const token = localStorage.getItem("adminToken");
        try {
            const res = await fetch("http://localhost:5000/api/admin/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ displayName, bio, phone })
            });
            const data = await res.json();
            if (data.success) {
                setProfile(data.data);
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (e) {
            console.error(e);
        }
        setSaving(false);
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const token = localStorage.getItem("adminToken");
        const formData = new FormData();
        formData.append("avatar", file);
        try {
            const res = await fetch("http://localhost:5000/api/admin/profile/avatar", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                setProfile(prev => ({ ...prev, avatarUrl: data.data.avatarUrl }));
            }
        } catch (e) {
            console.error(e);
        }
        setUploading(false);
    };

    if (!profile) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoaderCircle className="h-8 w-8 animate-spin text-[#0c1929]" />
            </div>
        );
    }

    const avatarSrc = profile.avatarUrl
        ? `http://localhost:5000${profile.avatarUrl}`
        : null;

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#0c1929]">Profile Settings</h1>
                <p className="mt-1 text-sm text-[#0c1929]">Update your profile information. This will be visible to your guests.</p>
            </div>

            {/* Avatar Section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-[#0c1929] mb-4">Profile Photo</p>
                <div className="flex items-center gap-6">
                    <div className="relative group">
                        {avatarSrc ? (
                            <img
                                src={avatarSrc}
                                alt="Admin avatar"
                                className="h-24 w-24 rounded-full object-cover border-2 border-slate-200 shadow-sm"
                            />
                        ) : (
                            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#0c1929] to-[#24456e] flex items-center justify-center text-white text-3xl font-bold shadow-sm">
                                {displayName ? displayName.charAt(0).toUpperCase() : <User className="h-10 w-10" />}
                            </div>
                        )}
                        <button
                            onClick={() => fileRef.current?.click()}
                            disabled={uploading}
                            className="absolute inset-0 flex items-center justify-center rounded-full bg-[#0c1929]/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                            {uploading ? (
                                <LoaderCircle className="h-6 w-6 animate-spin text-white" />
                            ) : (
                                <Camera className="h-6 w-6 text-white" />
                            )}
                        </button>
                        <input
                            type="file"
                            ref={fileRef}
                            onChange={handleAvatarUpload}
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                        />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-[#0c1929]">Upload a photo</p>
                        <p className="text-xs text-[#0c1929] mt-1">JPG, PNG or WebP. Max 5MB.</p>
                        <button
                            onClick={() => fileRef.current?.click()}
                            className="mt-3 text-sm font-semibold text-[#0c1929] hover:text-[#24456e] transition"
                        >
                            {avatarSrc ? "Change photo" : "Upload photo"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Info Section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-[#0c1929] mb-4">Personal Information</p>
                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-[#0c1929] mb-1.5">Display Name</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="How guests will see you"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-[#0c1929] outline-none focus:border-[#0c1929] focus:ring-2 focus:ring-[#0c1929]/10 transition"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#0c1929] mb-1.5">Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="A short description about yourself"
                            rows={3}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-[#0c1929] outline-none resize-none focus:border-[#0c1929] focus:ring-2 focus:ring-[#0c1929]/10 transition"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#0c1929] mb-1.5">Phone Number</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+1 (555) 000-0000"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-[#0c1929] outline-none focus:border-[#0c1929] focus:ring-2 focus:ring-[#0c1929]/10 transition"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#0c1929] mb-1.5">Email</label>
                        <input
                            type="email"
                            value={profile.email}
                            disabled
                            className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-[#0c1929] outline-none cursor-not-allowed"
                        />
                        <p className="text-xs text-[#0c1929] mt-1">Email cannot be changed here.</p>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0c1929] px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-[#0c1929]/20 transition hover:bg-[#152b47] disabled:opacity-60"
                >
                    {saving ? (
                        <><LoaderCircle className="h-4 w-4 animate-spin" /> Saving...</>
                    ) : saved ? (
                        <><Check className="h-4 w-4" /> Saved!</>
                    ) : (
                        <><Save className="h-4 w-4" /> Save Changes</>
                    )}
                </button>
            </div>
        </div>
    );
}
