"use client";
import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";

export default function CancellationPoliciesPage() {
  const [policies, setPolicies] = useState([]);
  const [activeShortTermPolicyId, setActiveShortTermPolicyId] = useState(null);
  const [activeLongTermPolicyId, setActiveLongTermPolicyId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [policyToApply, setPolicyToApply] = useState(null);
  
  const [deletePolicyId, setDeletePolicyId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  
  const [formData, setFormData] = useState({
    name: "",
    type: "SHORT_TERM",
    fullRefundDaysPrior: 5,
    partialRefundDaysPrior: 1,
    partialRefundPercentage: 50,
    bookingGracePeriodHours: 24,
    offerNonRefundableDiscount: false,
    nonRefundableDiscountPercentage: 10
  });

  const fetchPolicies = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/cancellation-policies", {
        headers: { "Authorization": `Bearer ${localStorage.getItem('adminToken')}` }
      });
      const data = await res.json();
      if (data.success) {
        setPolicies(data.data);
        setActiveShortTermPolicyId(data.activeShortTermPolicyId);
        setActiveLongTermPolicyId(data.activeLongTermPolicyId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleEdit = (policy) => {
    setEditingPolicy(policy);
    setFormData({
      name: policy.name,
      type: policy.type || 'SHORT_TERM',
      fullRefundDaysPrior: policy.fullRefundDaysPrior,
      partialRefundDaysPrior: policy.partialRefundDaysPrior,
      partialRefundPercentage: policy.partialRefundPercentage,
      bookingGracePeriodHours: policy.bookingGracePeriodHours,
      offerNonRefundableDiscount: policy.offerNonRefundableDiscount,
      nonRefundableDiscountPercentage: policy.nonRefundableDiscountPercentage
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    setDeletePolicyId(id);
  };

  const confirmDelete = async () => {
    if (!deletePolicyId) return;
    try {
      await fetch(`http://localhost:5000/api/cancellation-policies/${deletePolicyId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setDeletePolicyId(null);
      fetchPolicies();
      showToast("Policy deleted successfully.");
    } catch (e) {
      console.error(e);
      showToast("Failed to delete policy.", "error");
    }
  };

  const confirmApplyAll = async (type) => {
    if (!policyToApply) return;
    try {
      const res = await fetch(`http://localhost:5000/api/cancellation-policies/${policyToApply.id}/apply-all`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('adminToken')}` 
        },
        body: JSON.stringify({ type })
      });
      const data = await res.json();
      if (data.success) {
        setIsApplyModalOpen(false);
        if (type === 'LONG_TERM') {
          setActiveLongTermPolicyId(policyToApply.id);
        } else {
          setActiveShortTermPolicyId(policyToApply.id);
        }
        const name = policyToApply.name;
        setPolicyToApply(null);
        showToast(`Successfully applied "${name}" to all listings for ${type === 'LONG_TERM' ? 'Long' : 'Short'}-Term stays.`);
      } else {
        showToast(`Error: ${data.error}`, "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to apply policy.", "error");
    }
  };

  const handleRowClick = (policy) => {
    setPolicyToApply(policy);
    setIsApplyModalOpen(true);
  };

  const handleCreate = () => {
    setEditingPolicy(null);
    setFormData({
      name: "",
      type: "SHORT_TERM",
      fullRefundDaysPrior: 5,
      partialRefundDaysPrior: 1,
      partialRefundPercentage: 50,
      bookingGracePeriodHours: 24,
      offerNonRefundableDiscount: false,
      nonRefundableDiscountPercentage: 10
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const isEditing = !!editingPolicy;
      const url = isEditing 
        ? `http://localhost:5000/api/cancellation-policies/${editingPolicy.id}`
        : "http://localhost:5000/api/cancellation-policies";
      
      const payload = {
        ...formData,
        fullRefundDaysPrior: Number(formData.fullRefundDaysPrior),
        partialRefundDaysPrior: Number(formData.partialRefundDaysPrior),
        partialRefundPercentage: Number(formData.partialRefundPercentage),
        bookingGracePeriodHours: Number(formData.bookingGracePeriodHours),
        nonRefundableDiscountPercentage: Number(formData.nonRefundableDiscountPercentage),
      };

      await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('adminToken')}` 
        },
        body: JSON.stringify(payload)
      });
      setIsModalOpen(false);
      fetchPolicies();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans text-[#0c1929]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center z-10 shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0c1929]">Cancellation Policies</h1>
            <p className="text-sm text-[#0c1929] mt-1">Manage refund windows, grace periods, and non-refundable discounts.</p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-[#0c1929] hover:bg-[#0c1929] text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Policy
          </button>
        </header>

        <main className="flex-1 overflow-auto p-8 relative space-y-8">
          {isLoading ? (
            <div className="flex justify-center p-12 bg-white rounded-2xl border border-slate-200">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
          ) : (
            <>
              {/* Short Term Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-[#0c1929]">Short-Term Policies (&lt; 28 nights)</h3>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-white">
                      <th className="px-6 py-4 text-xs font-semibold text-[#0c1929] uppercase tracking-wider">Policy Name</th>
                      <th className="px-6 py-4 text-xs font-semibold text-[#0c1929] uppercase tracking-wider">Full Refund</th>
                      <th className="px-6 py-4 text-xs font-semibold text-[#0c1929] uppercase tracking-wider">Partial Refund</th>
                      <th className="px-6 py-4 text-xs font-semibold text-[#0c1929] uppercase tracking-wider">Grace Period</th>
                      <th className="px-6 py-4 text-xs font-semibold text-[#0c1929] uppercase tracking-wider">Non-Refundable Var</th>
                      <th className="px-6 py-4 text-xs font-semibold text-[#0c1929] uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {policies.filter(p => p.type === 'SHORT_TERM').length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-[#0c1929]">
                          <AlertCircle className="w-6 h-6 mx-auto mb-3 text-[#0c1929]" />
                          No short-term policies found.
                        </td>
                      </tr>
                    ) : (
                      policies.filter(p => p.type === 'SHORT_TERM').map((p) => {
                        const isShortActive = activeShortTermPolicyId === p.id;
                        return (
                          <tr key={p.id} className={`transition-all cursor-pointer border-l-4 ${isShortActive ? 'bg-emerald-50/50 border-emerald-500' : 'border-transparent hover:bg-slate-50'}`} onClick={() => handleRowClick(p)}>
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-[#0c1929]">
                              <div className="flex flex-col gap-1">
                                <span className="flex items-center gap-2">{p.name}</span>
                                {isShortActive && (
                                  <div className="flex gap-1">
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-800">
                                      <CheckCircle className="w-2.5 h-2.5 mr-1" /> Active
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0c1929]">≥ {p.fullRefundDaysPrior} days</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0c1929]">
                              {p.partialRefundDaysPrior > 0 ? `≥ ${p.partialRefundDaysPrior} days (${p.partialRefundPercentage}%)` : "None"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0c1929]">{p.bookingGracePeriodHours} hrs</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {p.offerNonRefundableDiscount ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Yes ({p.nonRefundableDiscountPercentage}%)
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-[#0c1929]">
                                  No
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button onClick={(e) => { e.stopPropagation(); handleEdit(p); }} className="text-indigo-600 hover:text-indigo-900 mr-4" title="Edit">
                                <Edit2 className="w-4 h-4 inline" />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="text-red-500 hover:text-red-700" title="Delete">
                                <Trash2 className="w-4 h-4 inline" />
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Long Term Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-[#0c1929]">Long-Term Policies (≥ 28 nights)</h3>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-white">
                      <th className="px-6 py-4 text-xs font-semibold text-[#0c1929] uppercase tracking-wider">Policy Name</th>
                      <th className="px-6 py-4 text-xs font-semibold text-[#0c1929] uppercase tracking-wider">Full Refund</th>
                      <th className="px-6 py-4 text-xs font-semibold text-[#0c1929] uppercase tracking-wider">Partial Refund</th>
                      <th className="px-6 py-4 text-xs font-semibold text-[#0c1929] uppercase tracking-wider">Grace Period</th>
                      <th className="px-6 py-4 text-xs font-semibold text-[#0c1929] uppercase tracking-wider">Non-Refundable Var</th>
                      <th className="px-6 py-4 text-xs font-semibold text-[#0c1929] uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {policies.filter(p => p.type === 'LONG_TERM').length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-[#0c1929]">
                          <AlertCircle className="w-6 h-6 mx-auto mb-3 text-[#0c1929]" />
                          No long-term policies found.
                        </td>
                      </tr>
                    ) : (
                      policies.filter(p => p.type === 'LONG_TERM').map((p) => {
                        const isLongActive = activeLongTermPolicyId === p.id;
                        return (
                          <tr key={p.id} className={`transition-all cursor-pointer border-l-4 ${isLongActive ? 'bg-emerald-50/50 border-emerald-500' : 'border-transparent hover:bg-slate-50'}`} onClick={() => handleRowClick(p)}>
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-[#0c1929]">
                              <div className="flex flex-col gap-1">
                                <span className="flex items-center gap-2">{p.name}</span>
                                {isLongActive && (
                                  <div className="flex gap-1">
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-800">
                                      <CheckCircle className="w-2.5 h-2.5 mr-1" /> Active
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0c1929]">≥ {p.fullRefundDaysPrior} days</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0c1929]">
                              {p.partialRefundDaysPrior > 0 ? `≥ ${p.partialRefundDaysPrior} days (${p.partialRefundPercentage}%)` : "None"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0c1929]">{p.bookingGracePeriodHours} hrs</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {p.offerNonRefundableDiscount ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Yes ({p.nonRefundableDiscountPercentage}%)
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-[#0c1929]">
                                  No
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button onClick={(e) => { e.stopPropagation(); handleEdit(p); }} className="text-indigo-600 hover:text-indigo-900 mr-4" title="Edit">
                                <Edit2 className="w-4 h-4 inline" />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="text-red-500 hover:text-red-700" title="Delete">
                                <Trash2 className="w-4 h-4 inline" />
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-[#0c1929]/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-[#0c1929]">
                {editingPolicy ? "Edit Policy" : "Create Policy"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#0c1929] hover:text-[#0c1929]">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#0c1929] mb-1">Policy Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c1929] focus:border-transparent text-sm"
                  placeholder="e.g., Strict, Moderate"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#0c1929] mb-1">Full Refund Days</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.fullRefundDaysPrior}
                    onChange={e => setFormData({ ...formData, fullRefundDaysPrior: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c1929] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0c1929] mb-1">Grace Period (Hours)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.bookingGracePeriodHours}
                    onChange={e => setFormData({ ...formData, bookingGracePeriodHours: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c1929] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-5">
                <div>
                  <label className="block text-sm font-medium text-[#0c1929] mb-1">Partial Refund Days</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.partialRefundDaysPrior}
                    onChange={e => setFormData({ ...formData, partialRefundDaysPrior: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c1929] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0c1929] mb-1">Partial Refund %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={formData.partialRefundPercentage}
                    onChange={e => setFormData({ ...formData, partialRefundPercentage: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c1929] text-sm"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5 space-y-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.offerNonRefundableDiscount}
                    onChange={e => setFormData({ ...formData, offerNonRefundableDiscount: e.target.checked })}
                    className="h-4 w-4 text-[#0c1929] focus:ring-[#0c1929] border-slate-300 rounded"
                  />
                  <span className="text-sm font-medium text-[#0c1929]">Offer Non-Refundable Discount Option</span>
                </label>

                {formData.offerNonRefundableDiscount && (
                  <div>
                    <label className="block text-sm font-medium text-[#0c1929] mb-1">Discount %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.nonRefundableDiscountPercentage}
                      onChange={e => setFormData({ ...formData, nonRefundableDiscountPercentage: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c1929] text-sm"
                    />
                  </div>
                )}
              </div>
            </form>
            
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-[#0c1929] hover:text-[#0c1929] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-5 py-2 text-sm font-medium text-white bg-[#0c1929] hover:bg-[#0c1929] rounded-xl transition-colors shadow-sm"
              >
                {editingPolicy ? "Save Changes" : "Create Policy"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Policy Modal */}
      {isApplyModalOpen && policyToApply && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-[#0c1929]/60 backdrop-blur-sm" onClick={() => setIsApplyModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-emerald-100 bg-emerald-50 rounded-t-2xl">
              <h3 className="text-lg font-bold text-emerald-900">
                Apply &quot;{policyToApply.name}&quot; Policy
              </h3>
              <button onClick={() => setIsApplyModalOpen(false)} className="text-emerald-700 hover:text-emerald-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-[#0c1929] font-medium">
                You are about to apply the <strong className="text-[#0c1929]">{policyToApply.name}</strong> policy to <strong className="text-[#0c1929]">all</strong> of your active listings.
              </p>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-semibold text-[#0c1929] mb-2">Policy Details:</h4>
                <ul className="list-disc list-inside space-y-1.5 text-sm text-[#0c1929]">
                  <li>Full Refund until <strong>{policyToApply.fullRefundDaysPrior} days</strong> before check-in.</li>
                  {policyToApply.partialRefundDaysPrior > 0 ? (
                    <li><strong>{policyToApply.partialRefundPercentage}% Refund</strong> between {policyToApply.fullRefundDaysPrior} and {policyToApply.partialRefundDaysPrior} days.</li>
                  ) : (
                    <li>No partial refund phase configured.</li>
                  )}
                  <li><strong>{policyToApply.bookingGracePeriodHours} hours</strong> grace period after booking.</li>
                  {policyToApply.offerNonRefundableDiscount ? (
                    <li>Offers a <strong>{policyToApply.nonRefundableDiscountPercentage}% Non-Refundable Discount</strong> option.</li>
                  ) : (
                    <li>No non-refundable discount offered.</li>
                  )}
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-medium leading-snug">
                  Warning: This action will rewrite the cancellation rules for every property currently in the database. This action cannot be easily undone.
                </p>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-[#0c1929] hover:text-[#0c1929] hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmApplyAll(policyToApply.type)}
                className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm"
              >
                Confirm & Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletePolicyId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-[#0c1929]/60 backdrop-blur-sm" onClick={() => setDeletePolicyId(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm flex flex-col overflow-hidden text-center">
            <div className="p-8 pb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-[#0c1929] mb-2">Delete Policy</h3>
              <p className="text-sm text-[#0c1929] leading-snug">
                Are you sure you want to delete this policy? This action cannot be undone.
              </p>
            </div>
            
            <div className="bg-slate-50 px-6 py-4 flex gap-3 border-t border-slate-100">
              <button 
                onClick={() => setDeletePolicyId(null)}
                className="flex-1 py-2.5 bg-white border border-slate-200 text-[#0c1929] rounded-xl font-medium shadow-sm hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium shadow-sm hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full text-sm font-medium shadow-xl z-[100] transition-all flex items-center gap-2.5 ${
          toast.type === 'success' ? 'bg-[#0c1929] text-white ring-1 ring-[#0c1929]' : 'bg-red-600 text-white ring-1 ring-red-700'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
