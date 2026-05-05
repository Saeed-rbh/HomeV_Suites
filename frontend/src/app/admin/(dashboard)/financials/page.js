"use client";
import { useState, useEffect } from 'react';
import { Download, FileText, ArrowRightLeft, LoaderCircle } from 'lucide-react';

export default function FinancialsModule() {
    const [entries, setEntries] = useState([]);
    const [stats, setStats] = useState({ escrow: 0, pending: 0, ytd: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLedger = async () => {
            try {
                const token = localStorage.getItem("adminToken");
                const res = await fetch("http://localhost:5000/api/accounting/journals", {
                    headers: {
                        "x-auth-token": token,
                        "Authorization": `Bearer ${token}`
                    }
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || data.error || "Failed to load ledger");
                
                let runningBalance = 0;
                let calcYtd = 0;
                let calcPayouts = 0;
                let calcGross = 0;
                const currentYear = new Date().getFullYear();

                const formatted = (data.data || []).map(entry => {
                    let type = "Income";
                    let debit = "-";
                    let credit = "-";
                    let desc = `Transfer: ${entry.debitAccount} to ${entry.creditAccount}`;

                    if (entry.creditAccount.toLowerCase().includes('revenue') || entry.creditAccount.toLowerCase().includes('income') || entry.creditAccount.toLowerCase().includes('trust')) {
                        type = "Income";
                        credit = `$${entry.amount.toFixed(2)}`;
                        runningBalance += entry.amount;
                        desc = `Payment Received: ${entry.creditAccount}`;
                    } else if (entry.debitAccount.toLowerCase().includes('fee') || entry.debitAccount.toLowerCase().includes('expense') || entry.debitAccount.toLowerCase().includes('cleaning')) {
                        type = entry.debitAccount.toLowerCase().includes('fee') ? "Fee" : "Expense";
                        debit = `$${entry.amount.toFixed(2)}`;
                        runningBalance -= entry.amount;
                        desc = `Deduction: ${entry.debitAccount}`;
                    } else if (entry.debitAccount.toLowerCase().includes('payout')) {
                        type = "Payout";
                        debit = `$${entry.amount.toFixed(2)}`;
                        runningBalance -= entry.amount;
                        desc = `Owner Payout Transfer`;
                    } else {
                        credit = `$${entry.amount.toFixed(2)}`;
                        runningBalance += entry.amount;
                    }

                    if (type === "Income") {
                        calcGross += entry.amount;
                        if (new Date(entry.createdAt).getFullYear() === currentYear) {
                            calcYtd += entry.amount;
                        }
                    } else if (type === "Payout") {
                        calcPayouts += entry.amount;
                    }

                    return {
                        id: `JRN-${entry.id.split('-')[0].toUpperCase()}`,
                        date: new Date(entry.createdAt).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' }),
                        desc: desc,
                        credit: credit,
                        debit: debit,
                        balance: runningBalance >= 0 ? `+$${runningBalance.toFixed(2)}` : `-$${Math.abs(runningBalance).toFixed(2)}`,
                        type: type
                    };
                });
                setEntries(formatted);
                setStats({
                    escrow: runningBalance,
                    pending: (calcGross * 0.85) - calcPayouts > 0 ? (calcGross * 0.85) - calcPayouts : 0,
                    ytd: calcYtd
                });
            } catch (err) {
                setError(err.message);
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchLedger();
    }, []);

    const list = entries;

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-[#0c1929] tracking-tight">Trust Accounting Ledger</h1>
                <div className="flex gap-4">
                    <button className="glass-button rounded-xl px-5 py-2.5 text-sm font-medium transition-all flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                </div>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass-panel p-6 rounded-3xl border border-white/60 relative overflow-hidden">
                    <div className="floating-orb w-24 h-24 bg-emerald-400/20 -top-6 -right-6"></div>
                    <p className="text-sm font-semibold text-[#0c1929] mb-1 relative z-10">Escrow Balance</p>
                    <h3 className="text-3xl font-bold text-[#0c1929] relative z-10">
                        ${stats.escrow.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h3>
                </div>
                <div className="glass-panel p-6 rounded-3xl border border-white/60 relative overflow-hidden">
                    <div className="floating-orb w-24 h-24 bg-blue-400/20 -top-6 -right-6"></div>
                    <p className="text-sm font-semibold text-[#0c1929] mb-1 relative z-10">Pending Payouts</p>
                    <h3 className="text-3xl font-bold text-[#0c1929] relative z-10">
                        ${stats.pending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h3>
                </div>
                <div className="glass-panel p-6 rounded-3xl border border-white/60 relative overflow-hidden">
                    <div className="floating-orb w-24 h-24 bg-purple-400/20 -top-6 -right-6"></div>
                    <p className="text-sm font-semibold text-[#0c1929] mb-1 relative z-10">YTD Revenue</p>
                    <h3 className="text-3xl font-bold text-[#0c1929] relative z-10">
                        ${stats.ytd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h3>
                </div>
            </div>

            <div className="glass-panel overflow-hidden flex-1 border border-white/60">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/40 text-xs text-[#0c1929] uppercase tracking-wider bg-white/10">
                                <th className="px-6 py-5 font-bold">Transaction</th>
                                <th className="px-6 py-5 font-bold">Description</th>
                                <th className="px-6 py-5 font-bold">Category</th>
                                <th className="px-6 py-5 font-bold text-right">Credit</th>
                                <th className="px-6 py-5 font-bold text-right">Debit</th>
                                <th className="px-6 py-5 font-bold text-right">Running Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/30 text-sm text-[#0c1929]">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <LoaderCircle className="w-8 h-8 text-[#0c1929] animate-spin mx-auto mb-3" />
                                        <span className="text-[#0c1929] font-medium">Reconciling ledger data...</span>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-red-500 font-medium">
                                        Error loading ledger: {error}
                                    </td>
                                </tr>
                            ) : list.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-[#0c1929] font-medium">
                                        No journal entries found in the trust ledger.
                                    </td>
                                </tr>
                            ) : list.map((entry, idx) => (
                                <tr key={idx} className="hover:bg-white/40 transition-colors backdrop-blur-md">
                                    <td className="px-6 py-5">
                                        <span className="font-bold text-[#0c1929] block">{entry.id}</span>
                                        <span className="text-xs text-[#0c1929]">{entry.date}</span>
                                    </td>
                                    <td className="px-6 py-5 font-medium text-[#0c1929]">{entry.desc}</td>
                                    <td className="px-6 py-5">
                                        <span className={`px-2 py-1 flex items-center w-max gap-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${entry.type === 'Income' ? 'bg-emerald-100 text-emerald-700' :
                                                entry.type === 'Payout' ? 'bg-blue-100 text-blue-700' :
                                                    entry.type === 'Expense' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-slate-200 text-[#0c1929]'
                                            }`}>
                                            {entry.type === 'Income' || entry.type === 'Payout' ? <ArrowRightLeft className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                                            {entry.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right font-bold text-emerald-600">{entry.credit}</td>
                                    <td className="px-6 py-5 text-right font-bold text-rose-500">{entry.debit}</td>
                                    <td className="px-6 py-5 text-right font-bold text-[#0c1929]">{entry.balance}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
