"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, ShieldAlert, LoaderCircle, Mail, Phone, Copy, Check, Camera, Crown } from "lucide-react";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

export default function AdminAccessManagement() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  const [editingNameId, setEditingNameId] = useState(null);
  const [tempName, setTempName] = useState("");

  // Form states
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetStaff, setTargetStaff] = useState(null);

  const fileRefs = useRef({});

  const formatPhone = (phoneStr) => {
    if (!phoneStr) return phoneStr;
    const digits = phoneStr.replace(/\D/g, '');
    if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    if (digits.length === 11 && digits.startsWith('1')) return `+1 ${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
    return phoneStr;
  };

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') + '') + "/admin/staff", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || errorData.msg || "Failed to load staff list");
      }
      const data = await res.json();
      setStaff(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!email && !phone) {
      setError("Please provide either an email or a phone number.");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') + '') + "/admin/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ email, phone, firstName, lastName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.msg || "Failed to add administrator.");

      setSuccess("Teammate successfully granted secure Admin access!");
      setEmail("");
      setPhone("");
      setFirstName("");
      setLastName("");
      fetchStaff();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveStaff = async (id) => {
    setError("");
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') + ''}/admin/staff/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.msg || "Failed to revoke access.");

      setSuccess("Account successfully removed from the system.");
      fetchStaff();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAvatarUpload = async (userId, file) => {
    if (!file) return;
    setUploadingId(userId);
    const token = localStorage.getItem("adminToken");
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') + ''}/admin/staff/${userId}/avatar`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setStaff(prev => prev.map(s => s.id === userId ? { ...s, avatarUrl: data.avatarUrl } : s));
      }
    } catch (e) {
      console.error(e);
    }
    setUploadingId(null);
  };

  const handleUpdateName = async (userId) => {
    const token = localStorage.getItem("adminToken");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') + ''}/admin/staff/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ displayName: tempName })
      });
      if (res.ok) {
        setStaff(prev => prev.map(s => s.id === userId ? { ...s, displayName: tempName } : s));
        setEditingNameId(null);
        setSuccess("Name updated!");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetHost = async (userId) => {
    const token = localStorage.getItem("adminToken");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') + ''}/admin/staff/${userId}/host`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setStaff(prev => prev.map(s => ({ ...s, isHost: s.id === userId })));
        setSuccess("Responsible host updated!");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText("http://localhost:3000/login");
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0c1929] tracking-tight border-b border-white/40 pb-4">
          Team Access Management
        </h1>
        <p className="mt-2 text-sm font-medium text-[#0c1929]">
          Control who has administrator permissions across HomEV. Upload profile photos and designate one admin as the <strong>Responsible Host</strong> — their photo and name will appear on guest dashboards.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 flex gap-3 text-red-700 text-sm">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-emerald-700 text-sm">
          <p className="font-medium">{success}</p>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* ADD STAFF FORM */}
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_30px_rgba(12,25,41,0.02)] p-6 col-span-1 lg:sticky lg:top-8">
          <h3 className="text-lg font-semibold text-[#0c1929] mb-6">Authorize New Member</h3>
          <form onSubmit={handleAddStaff} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#0c1929] mb-1 ml-1 uppercase tracking-wider">First Name</label>
                <input
                  type="text"
                  value={firstName} onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-xl bg-white border border-slate-300 placeholder:text-[#0c1929] px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c1929] transition-all"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#0c1929] mb-1 ml-1 uppercase tracking-wider">Last Name</label>
                <input
                  type="text"
                  value={lastName} onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-xl bg-white border border-slate-300 placeholder:text-[#0c1929] px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c1929] transition-all"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0c1929] mb-1 ml-1 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0c1929]" />
                <input
                  type="email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-white border border-slate-300 placeholder:text-[#0c1929] pl-10 pr-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c1929] transition-all"
                  placeholder="team@example.com"
                />
              </div>
            </div>

            <div className="flex items-center">
              <div className="flex-grow border-t border-slate-300"></div>
              <span className="mx-4 text-xs font-bold text-[#0c1929] uppercase tracking-widest">OR</span>
              <div className="flex-grow border-t border-slate-300"></div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0c1929] mb-1 ml-1 uppercase tracking-wider">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0c1929]" />
                <input
                  type="tel"
                  value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl bg-white border border-slate-300 placeholder:text-[#0c1929] pl-10 pr-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c1929] transition-all"
                  placeholder="+15551234567"
                />
              </div>
              <p className="mt-2 text-xs font-medium text-[#0c1929] pl-1">Exactly as they will type it, including country code (e.g. +1...)</p>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting || (!email && !phone)}
                className="w-full flex items-center justify-center gap-2 rounded-[16px] bg-[#0c1929] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#152b47] disabled:bg-slate-200 disabled:text-[#0c1929]"
              >
                {submitting ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                Grant Admin Access
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={copyInviteLink}
                className="w-full flex justify-center items-center gap-2 text-xs font-medium text-[#0c1929] hover:text-[#0c1929] transition-colors"
                title="Copy standard login portal URL"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {isCopied ? "Link Copied!" : "Copy Secure Login Link"}
              </button>
            </div>
          </form>
        </div>

        {/* ACTIVE STAFF LIST */}
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_30px_rgba(12,25,41,0.02)] overflow-hidden col-span-1 lg:col-span-2">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-base font-semibold text-[#0c1929]">Active Administrators</h3>
            <span className="text-xs font-medium text-[#0c1929] bg-white border border-slate-200 py-1 px-3 rounded-full shadow-sm">
              {staff.length} {staff.length === 1 ? 'Member' : 'Members'}
            </span>
          </div>

          <div className="p-0">
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <LoaderCircle className="w-8 h-8 text-slate-300 animate-spin" />
              </div>
            ) : staff.length === 0 ? (
              <div className="p-12 text-center text-[#0c1929] text-sm">
                No administrators found.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {staff.map((user) => (
                  <li key={user.id} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-4">
                      {/* Avatar with upload overlay */}
                      <div className="relative group/avatar">
                        {user.avatarUrl ? (
                          <img
                            src={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '')}${user.avatarUrl}`}
                            alt={user.displayName || "Admin"}
                            className="h-12 w-12 rounded-full object-cover border-2 border-slate-200"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#0c1929] to-[#24456e] flex items-center justify-center text-white text-lg font-bold">
                            {(user.displayName || user.email || "?").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <button
                          onClick={() => fileRefs.current[user.id]?.click()}
                          disabled={uploadingId === user.id}
                          className="absolute inset-0 flex items-center justify-center rounded-full bg-[#0c1929]/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer"
                        >
                          {uploadingId === user.id ? (
                            <LoaderCircle className="h-4 w-4 animate-spin text-white" />
                          ) : (
                            <Camera className="h-4 w-4 text-white" />
                          )}
                        </button>
                        <input
                          type="file"
                          ref={el => fileRefs.current[user.id] = el}
                          onChange={(e) => handleAvatarUpload(user.id, e.target.files?.[0])}
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                        />
                        {/* Host Crown Badge */}
                        {user.isHost && (
                          <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-400 flex items-center justify-center shadow-sm border-2 border-white">
                            <Crown className="h-2.5 w-2.5 text-white" />
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-[#0c1929] flex items-center gap-2">
                          {editingNameId === user.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                className="px-2 py-1 text-xs border border-slate-300 rounded outline-none focus:ring-1 focus:ring-[#0c1929]"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleUpdateName(user.id)}
                              />
                              <button onClick={() => handleUpdateName(user.id)} className="text-emerald-600 hover:text-emerald-700 font-bold text-xs underline">Save</button>
                              <button onClick={() => setEditingNameId(null)} className="text-[#0c1929] hover:text-[#0c1929] font-bold text-xs underline">Cancel</button>
                            </div>
                          ) : (
                            <>
                              <span 
                                onClick={() => { setEditingNameId(user.id); setTempName(user.displayName || user.firstName || ""); }}
                                className="cursor-pointer hover:text-[#0c1929] border-b border-transparent hover:border-slate-300 transition-all"
                                title="Click to edit name"
                              >
                                {user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email?.split('@')[0]}
                              </span>
                              <button 
                                onClick={() => { setEditingNameId(user.id); setTempName(user.displayName || user.firstName || ""); }}
                                className="p-1 rounded bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Edit display name"
                              >
                                <Plus className="w-2.5 h-2.5 text-[#0c1929] rotate-45" /> {/* Using a rotated plus as a simple edit hint */}
                              </button>
                            </>
                          )}
                          {user.isHost && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] uppercase font-bold py-0.5 px-2 rounded-full">Responsible Host</span>
                          )}
                          {user.email && user.email.includes('@placeholder.com') ? (
                            <span className="bg-amber-100 text-amber-800 text-[10px] uppercase font-bold py-0.5 px-2 rounded-full">Phone Only</span>
                          ) : null}
                        </h4>
                        <p className="mt-1 flex items-center gap-4 text-xs font-medium text-[#0c1929]">
                          {user.email && !user.email.includes('@placeholder.com') && (
                            <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {user.email}</span>
                          )}
                          {user.phone && (
                            <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {formatPhone(user.phone)}</span>
                          )}
                        </p>
                        <p className="mt-2 text-[11px] font-medium text-[#0c1929]">
                          Authorized {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Set as Host button */}
                      {!user.isHost && (
                        <button
                          onClick={() => handleSetHost(user.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-200 text-amber-700 text-xs font-semibold hover:bg-amber-50 transition-colors"
                          title="Set as Responsible Host shown to guests"
                        >
                          <Crown className="w-3.5 h-3.5" />
                          Set as Host
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (staff.length <= 1) return;
                          setTargetStaff(user);
                          setIsModalOpen(true);
                        }}
                        disabled={staff.length <= 1}
                        className={`p-2.5 rounded-full transition-all focus:outline-none border border-transparent 
                          ${staff.length <= 1 ? 'text-slate-300 cursor-not-allowed' : 'text-[#0c1929] hover:text-red-600 hover:bg-red-50 hover:border-red-100'}`}
                        title={staff.length <= 1 ? "Cannot remove the last remaining administrator" : "Revoke Admin Access"}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => handleRemoveStaff(targetStaff?.id)}
        title="Revoke Administrator Access"
        message="Are you sure you want to permanently remove this user's administrative authority? They will immediately lose access to the admin dashboard and all sensitive system controls. This action cannot be revoked without re-authorizing them."
        itemName={targetStaff ? `${targetStaff.firstName || ''} ${targetStaff.lastName || ''}` || targetStaff.email || targetStaff.phone : ""}
      />
    </div>
  );
}
