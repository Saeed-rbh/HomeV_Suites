"use client";

import { useState, useEffect } from "react";
import { Users, Mail, Phone, Calendar, LoaderCircle, Search, Trash2, Mail as MailIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";

export default function GuestsModule() {
  const router = useRouter();
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetGuest, setTargetGuest] = useState(null);

  useEffect(() => {
    const fetchGuests = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const res = await fetch("http://localhost:5000/api/guests", {
          headers: {
            "x-auth-token": token,
            "Authorization": `Bearer ${token}`
          }
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.msg || data.error || "Failed to load guest directory");
        }

        if (data.success && data.data) {
          setGuests(data.data);
        } else {
          setGuests(data);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGuests();
  }, []);

  const filteredGuests = guests.filter(g => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      (g.firstName && g.firstName.toLowerCase().includes(term)) ||
      (g.lastName && g.lastName.toLowerCase().includes(term)) ||
      (g.email && g.email.toLowerCase().includes(term)) ||
      (g.phone && g.phone.includes(term))
    );
  });

  const handleDeleteGuest = async (id) => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`http://localhost:5000/api/guests/${id}`, {
        method: "DELETE",
        headers: {
          "x-auth-token": token,
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.msg || "Failed to delete guest");

      setGuests(guests.filter(g => g.id !== id));
      setIsModalOpen(false);
      setTargetGuest(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const formatPhone = (phoneStr) => {
    if (!phoneStr) return phoneStr;
    const digits = phoneStr.replace(/\D/g, '');
    if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    if (digits.length === 11 && digits.startsWith('1')) return `+1 ${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
    return phoneStr;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#0c1929] tracking-tight">Guest Directory</h1>
          <p className="mt-1 text-sm text-[#0c1929] font-medium">A secure repository of every individual who has submitted their contact information and stayed with us.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0c1929]" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 placeholder:text-[#0c1929] text-sm text-[#0c1929] focus:outline-none focus:ring-2 focus:ring-[#0c1929] transition-all shadow-[0_2px_10px_rgba(12,25,41,0.02)]"
            />
          </div>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 border border-red-100 rounded-xl p-4 text-sm font-medium mb-4 shadow-sm">
          Error: {error}
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center flex-1 bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_30px_rgba(12,25,41,0.02)]">
          <LoaderCircle className="w-8 h-8 text-slate-300 animate-spin" />
          <p className="mt-4 text-sm text-[#0c1929] font-medium tracking-wide">Decrypting directory records...</p>
        </div>
      ) : (
        <div className="bg-white rounded-[24px] overflow-hidden flex-1 border border-slate-200 shadow-[0_4px_30px_rgba(12,25,41,0.02)]">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-xs font-bold tracking-widest uppercase text-[#0c1929] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0c1929]" /> Validated Records
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#0c1929] bg-white shadow-sm border border-slate-200 py-1.5 px-3 rounded-full">
              {filteredGuests.length} Total
            </span>
          </div>
          <div className="overflow-x-auto h-[calc(100vh-280px)]">
            <table className="w-full text-left border-collapse relative">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-slate-100 text-[10px] text-[#0c1929] uppercase tracking-widest bg-white">
                  <th className="px-6 py-4 font-bold">Guest Identity</th>
                  <th className="px-6 py-4 font-bold">Contact Intelligence</th>
                  <th className="px-6 py-4 font-bold text-center">Account Created</th>
                  <th className="px-6 py-4 font-bold text-center">Lifetime Bookings</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-[#0c1929] bg-white">
                {filteredGuests.length > 0 ? filteredGuests.map(guest => (
                  <tr key={guest.id} onClick={() => router.push(`/admin/guests/${guest.id}`)} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-blue-700 font-bold text-sm border border-blue-100/50 shadow-sm">
                          {guest.firstName ? guest.firstName.charAt(0).toUpperCase() : 'G'}
                        </div>
                        <div>
                          <p className="font-bold text-[#0c1929] group-hover:text-blue-700 transition-colors">
                            {guest.firstName} {guest.lastName}
                          </p>
                          <p className="text-[10px] font-mono text-[#0c1929] mt-0.5 tracking-wider uppercase">ID: {guest.id.split('-')[0]}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1.5 text-xs text-[#0c1929] font-medium">
                        {guest.email && !guest.email.includes('@placeholder.com') && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-[#0c1929]" />
                            {guest.email}
                          </div>
                        )}
                        {guest.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-[#0c1929]" />
                            {formatPhone(guest.phone)}
                          </div>
                        )}
                        {(!guest.email || guest.email.includes('@placeholder.com')) && !guest.phone && (
                          <span className="text-[#0c1929] italic">No direct contact available</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#0c1929] uppercase tracking-wider">
                        <Calendar className="w-3.5 h-3.5 text-[#0c1929]" />
                        {new Date(guest.createdAt).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {guest._count?.reservations > 0 ? (
                        <span className="inline-flex items-center justify-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold ring-1 ring-inset ring-blue-100">
                          {guest._count.reservations}
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center px-3 py-1 bg-slate-100 text-[#0c1929] rounded-full text-xs font-semibold ring-1 ring-inset ring-slate-200">
                          Zero
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right flex justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTargetGuest(guest);
                          setIsModalOpen(true);
                        }}
                        className="text-slate-300 hover:text-red-500 transition p-2 bg-white hover:bg-red-50 rounded-lg border border-slate-100 hover:border-red-100 shadow-sm"
                        title="Delete Guest"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); router.push('/admin/inbox'); }} className="text-blue-500 hover:text-blue-700 transition p-2 bg-blue-50/50 hover:bg-blue-100 rounded-lg border border-blue-100 shadow-sm" title="Message Guest">
                        <MailIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center text-[#0c1929] font-medium text-sm">
                      {search ? "No guests match your search sequence." : "The guest database is currently empty."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => handleDeleteGuest(targetGuest?.id)}
        title="Delete Guest Profile"
        message="Are you sure you want to permanently purge this guest from your records? This will erase all their past bookings, payment history, and message threads. This action is irreversible."
        itemName={targetGuest ? `${targetGuest.firstName} ${targetGuest.lastName}` : ""}
      />
    </div>
  );
}
