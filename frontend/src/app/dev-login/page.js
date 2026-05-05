"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, AlertTriangle } from "lucide-react";

export default function DevLoginPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Connecting...");
  const [error, setError] = useState("");

  useEffect(() => {
    const doLogin = async () => {
      try {
        setStatus("Fetching admin token...");
        const res = await fetch((process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') + '') + "/dev-admin-login");
        const data = await res.json();

        if (!res.ok || !data.token) {
          throw new Error(data.error || "Failed to obtain token");
        }

        setStatus(`Authenticated as ${data.user.email} — redirecting...`);
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminUser", JSON.stringify(data.user));

        // Small delay so the message is readable
        setTimeout(() => router.replace("/admin"), 800);
      } catch (err) {
        setError(err.message);
        setStatus("Failed");
      }
    };

    doLogin();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fb]">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-10 flex flex-col items-center gap-5 max-w-sm w-full mx-4">
        <div className="w-14 h-14 rounded-2xl bg-[#0c1929] flex items-center justify-center">
          <ShieldCheck className="w-7 h-7 text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-lg font-bold text-[#0c1929]">Dev Admin Bypass</h1>
          <p className="text-xs text-[#0c1929] mt-1">Local development only — not available in production</p>
        </div>

        {!error ? (
          <div className="flex flex-col items-center gap-3 mt-2">
            <Loader2 className="w-6 h-6 text-[#0c1929] animate-spin" />
            <p className="text-sm text-[#0c1929] font-medium text-center">{status}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 mt-2">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <p className="text-sm text-red-600 font-semibold text-center">{error}</p>
            <p className="text-xs text-[#0c1929] text-center">Make sure the backend is running on port 5000 and there is at least one admin user in the database.</p>
          </div>
        )}
      </div>
    </div>
  );
}
