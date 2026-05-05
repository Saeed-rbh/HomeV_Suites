"use client";

import { auth } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { useState } from "react";
import { LoaderCircle, Mail, KeyRound, Phone, User, ArrowLeft } from "lucide-react";

export default function UnifiedAuthForm({ onLoginSuccess, title = "Secure Access", subtitle = "Sign in to your account", icon }) {
  // Steps: 1=enter identifier, 1.5=registration, 2=enter OTP
  const [step, setStep] = useState(1);
  const [loginMethod, setLoginMethod] = useState("email");
  const [countryCode, setCountryCode] = useState("+1");
  const [identifier, setIdentifier] = useState("");

  // Registration fields
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  // Track which email to use during OTP verification (may come from registration)
  const [otpEmail, setOtpEmail] = useState("");

  const setupRecaptcha = () => {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
      'callback': () => {}
    });
  };

  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "");
    let formatted = digits;
    if (digits.length > 3 && digits.length <= 6) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else if (digits.length > 6) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
    setIdentifier(formatted);
  };

  const handleRegPhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "");
    let formatted = digits;
    if (digits.length > 3 && digits.length <= 6) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else if (digits.length > 6) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
    setRegPhone(formatted);
  };

  async function requestOtp(e) {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (loginMethod === "email") {
        // Step 1: Check if user exists
        const checkRes = await fetch("http://localhost:5000/api/auth/check-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier })
        });
        const checkData = await checkRes.json();

        if (checkData.exists) {
          // Existing user → send OTP directly
          const res = await fetch("http://localhost:5000/api/auth/request-email-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: identifier })
          });
          if (!res.ok) throw new Error("Failed to send login code.");
          setOtpEmail(identifier);
          setStep(2);
        } else {
          // New user → show registration form, pre-fill email
          setRegEmail(identifier);
          setStep(1.5);
        }
      } else {
        // Phone login: check first
        const rawPhone = `${countryCode}${identifier.replace(/\D/g, "")}`;
        const checkRes = await fetch("http://localhost:5000/api/auth/check-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: rawPhone })
        });
        const checkData = await checkRes.json();

        if (checkData.exists) {
          // Existing user → Firebase SMS
          setupRecaptcha();
          const result = await signInWithPhoneNumber(auth, rawPhone, window.recaptchaVerifier);
          setConfirmationResult(result);
          setStep(2);
        } else {
          // New user → show registration form, pre-fill phone
          setRegPhone(identifier);
          setStep(1.5);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const regPhoneRaw = regPhone ? `+1${regPhone.replace(/\D/g, "")}` : null;

      if (loginMethod === "phone") {
        // Register via the new API, then send Firebase SMS too
        const res = await fetch("http://localhost:5000/api/auth/create-guest-and-send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firstName: regFirstName, lastName: regLastName, email: regEmail, phone: regPhoneRaw })
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Registration failed"); }
        // Also fire Firebase SMS for phone users
        setupRecaptcha();
        const rawPhone = `${countryCode}${identifier.replace(/\D/g, "")}`;
        const result = await signInWithPhoneNumber(auth, rawPhone, window.recaptchaVerifier);
        setConfirmationResult(result);
        setOtpEmail(regEmail);
        setStep(2);
      } else {
        // Email registration
        const res = await fetch("http://localhost:5000/api/auth/create-guest-and-send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firstName: regFirstName, lastName: regLastName, email: regEmail, phone: regPhoneRaw })
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Registration failed"); }
        setOtpEmail(regEmail);
        setStep(2);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e) {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (loginMethod === "phone" && confirmationResult) {
        const result = await confirmationResult.confirm(otp);
        const idToken = await result.user.getIdToken();
        await completeLogin(idToken, null);
      } else {
        await completeLogin(null, otp);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  async function completeLogin(idToken, otpValue) {
    try {
      const emailToVerify = otpEmail || identifier;
      const payload = idToken
        ? { idToken, identifier: `${countryCode}${identifier.replace(/\D/g, "")}` }
        : { otp: otpValue, identifier: emailToVerify };

      const res = await fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error("Server said: " + (errorData.msg || "Invalid code"));
      }

      const data = await res.json();

      if (data.role === "GUEST") {
        const profile = data.guest || {};
        localStorage.setItem("guestToken", data.token);
        localStorage.setItem("guestName", [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Guest");
        localStorage.setItem("guestEmail", profile.email || "");
        document.cookie = `guestToken=${data.token}; path=/; max-age=604800; SameSite=Lax`;
        if (onLoginSuccess) { onLoginSuccess(profile); } 
        else { window.location.href = "/trips"; }
      } else {
        const profile = data.user || {};
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminName", [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.email || "Admin");
        document.cookie = `adminToken=${data.token}; path=/; max-age=604800; SameSite=Lax`;
        window.location.href = "/admin";
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full bg-transparent text-base text-[#0c1929] outline-none placeholder:text-[#0c1929]";
  const labelCls = "block rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-[#0c1929] transition hover:border-slate-300 focus-within:ring-2 focus-within:ring-[#0c1929] focus-within:border-transparent";
  const spanCls = "flex items-center gap-2 mb-1 text-[#0c1929] font-medium";

  const getStepTitle = () => {
    if (step === 1) return subtitle;
    if (step === 1.5) return "Complete Your Profile";
    return "Verification";
  };

  const getStepSubtitle = () => {
    if (step === 1) return "Select your preferred sign in method.";
    if (step === 1.5) return "We couldn't find your account. Fill in your details to get started.";
    return `We sent a 6-digit secure code to your ${loginMethod === "phone" ? "phone" : "email"}.`;
  };

  return (
    <div className="flex min-h-[calc(100vh-100px)] w-full items-center justify-center bg-[#f3f5f8] px-4">
      <div className="w-full max-w-md rounded-[30px] bg-white border border-slate-100 shadow-[0_4px_30px_rgba(12,25,41,0.03)] p-8">
        <div className="mb-8 text-center text-[#0c1929]">
          {icon && (
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#0c1929]/10 text-[#0c1929]">
              {icon}
            </div>
          )}
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#0c1929]">{title}</p>
          <h2 className="mt-2 text-3xl font-medium tracking-tight text-[#0c1929]">{getStepTitle()}</h2>
          <p className="mt-3 text-sm text-[#0c1929]">{getStepSubtitle()}</p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm text-red-600">{error}</div>
        )}

        {/* ── Step 1: Enter email or phone ── */}
        {step === 1 && (
          <form onSubmit={requestOtp} className="space-y-6">
            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button type="button" onClick={() => { setLoginMethod("email"); setIdentifier(""); setError(""); }}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${loginMethod === "email" ? "bg-white text-[#0c1929] shadow" : "text-[#0c1929] hover:text-[#0c1929] hover:bg-slate-50"}`}>
                Email
              </button>
              <button type="button" onClick={() => { setLoginMethod("phone"); setIdentifier(""); setError(""); }}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${loginMethod === "phone" ? "bg-white text-[#0c1929] shadow" : "text-[#0c1929] hover:text-[#0c1929] hover:bg-slate-50"}`}>
                Phone
              </button>
            </div>

            {loginMethod === "email" ? (
              <label className={labelCls}>
                <span className={spanCls}><Mail className="w-4 h-4" />Email Address</span>
                <input type="email" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required placeholder="name@example.com" className={inputCls} />
              </label>
            ) : (
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-2 mb-1 px-1 text-[#0c1929] text-sm font-medium"><Phone className="w-4 h-4" />Phone Number</span>
                <div className="flex gap-2">
                  <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)}
                    className="w-[100px] rounded-2xl border border-slate-200 bg-white px-3 py-4 text-base text-[#0c1929] transition hover:border-slate-300 focus-within:ring-2 focus-within:ring-[#0c1929] outline-none appearance-none">
                    <option value="+1">🇺🇸 CA/US (+1)</option>
                    <option value="+44">🇬🇧 UK (+44)</option>
                    <option value="+61">🇦🇺 AU (+61)</option>
                    <option value="+91">🇮🇳 IN (+91)</option>
                    <option value="+49">🇩🇪 DE (+49)</option>
                  </select>
                  <input type="tel" value={identifier} onChange={handlePhoneChange} required placeholder="555-123-4567"
                    className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base text-[#0c1929] transition hover:border-slate-300 focus-within:ring-2 focus-within:ring-[#0c1929] focus-within:border-transparent outline-none placeholder:text-[#0c1929]" />
                </div>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="flex w-full items-center justify-center rounded-[24px] bg-[#0c1929] px-6 py-4 text-base font-semibold text-white transition hover:bg-[#152b47] disabled:opacity-70">
              {loading ? <LoaderCircle className="w-5 h-5 animate-spin mr-2" /> : null}
              Continue
            </button>
          </form>
        )}

        {/* ── Step 1.5: New user registration ── */}
        {step === 1.5 && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <label className={labelCls}>
                <span className={spanCls}><User className="w-4 h-4" />First Name</span>
                <input type="text" value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} required placeholder="John" className={inputCls} />
              </label>
              <label className={labelCls}>
                <span className={spanCls}><User className="w-4 h-4" />Last Name</span>
                <input type="text" value={regLastName} onChange={(e) => setRegLastName(e.target.value)} placeholder="Doe" className={inputCls} />
              </label>
            </div>

            <label className={labelCls}>
              <span className={spanCls}><Mail className="w-4 h-4" />Email Address</span>
              <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required placeholder="name@example.com" className={inputCls} />
            </label>

            <label className={labelCls}>
              <span className={spanCls}><Phone className="w-4 h-4" />Phone Number</span>
              <input type="tel" value={regPhone} onChange={handleRegPhoneChange} placeholder="555-123-4567" className={inputCls} />
            </label>

            <button type="submit" disabled={loading}
              className="flex w-full items-center justify-center rounded-[24px] bg-[#0c1929] px-6 py-4 text-base font-semibold text-white transition hover:bg-[#152b47] disabled:opacity-70 mt-2">
              {loading ? <LoaderCircle className="w-5 h-5 animate-spin mr-2" /> : null}
              Create Account & Get Code
            </button>

            <button type="button" onClick={() => { setStep(1); setError(""); }}
              className="flex w-full items-center justify-center gap-2 text-sm text-[#0c1929] hover:text-[#0c1929] transition-colors pt-1">
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </button>
          </form>
        )}

        {/* ── Step 2: Enter OTP ── */}
        {step === 2 && (
          <form onSubmit={verifyOtp} className="space-y-6">
            <label className={labelCls}>
              <span className={spanCls}><KeyRound className="w-4 h-4" />Verification Code</span>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required placeholder="000 000"
                className="w-full bg-transparent text-lg tracking-[0.3em] font-medium text-center text-[#0c1929] outline-none placeholder:text-[#0c1929]" />
            </label>
            <button type="submit" disabled={loading}
              className="flex w-full items-center justify-center rounded-[24px] bg-[#0c1929] px-6 py-4 text-base font-semibold text-white transition hover:bg-[#152b47] disabled:opacity-70">
              {loading ? <LoaderCircle className="w-5 h-5 animate-spin mr-2" /> : null}
              Verify and Sign In
            </button>

            <div className="flex items-center justify-between pt-2 px-1">
              <button type="button" onClick={() => setStep(1)}
                className="text-sm text-[#0c1929] hover:text-[#0c1929] font-medium transition-colors focus:outline-none">
                &larr; Back
              </button>
              <button type="button" onClick={requestOtp} disabled={loading}
                className="text-sm font-semibold text-[#0c1929] hover:text-[#152b47] transition-colors focus:outline-none disabled:opacity-50">
                Resend Code
              </button>
            </div>
          </form>
        )}

        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
}
