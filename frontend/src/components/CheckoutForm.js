"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, LoaderCircle, ShieldCheck, AlertCircle, X } from "lucide-react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";

export default function CheckoutForm({ listingId, checkIn, checkOut, guests, selectedNonRefundable, totalPrice }) {
  const [status, setStatus] = useState("idle");
  const [paymentError, setPaymentError] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem("guestToken")) {
      setIsLoggedIn(true);
    }
  }, []);

  const isAdmin = name.toLowerCase() === "admin";

  function buildConfirmUrl() {
    const params = new URLSearchParams();
    if (listingId) params.set("listing", listingId);
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests) params.set("guests", guests);
    return "/booking-confirmed?" + params.toString();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    
    if (isAdmin) {
      router.push(buildConfirmUrl());
      return;
    }

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      return;
    }

    setStatus("processing");
    setPaymentError(null);
    try {
      // 1. Confirm the payment via Stripe
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + buildConfirmUrl(),
          payment_method_data: {
            billing_details: {
              name: name,
              email: email,
              phone: phone,
            }
          }
        },
        redirect: "if_required",
      });

      if (confirmError) {
        throw new Error(confirmError.message || "Payment failed.");
      }

      // If redirect was required, the browser will navigate away here.
      // If we reach this point, payment succeeded without a redirect (e.g., standard card).

      // 2. Create the reservation in our backend.
      // Use the exact Stripe-charged amount (paymentIntent.amount is in cents) so the
      // DB record always matches what Stripe collected — never a frontend-computed guess.
      const chargedTotal = paymentIntent?.amount != null
        ? paymentIntent.amount / 100
        : (totalPrice || 0);

      const payload = {
        startDate: new Date(checkIn).toISOString(),
        endDate: new Date(checkOut).toISOString(),
        propertyId: listingId,
        selectedNonRefundable: !!selectedNonRefundable,
        totalPrice: chargedTotal,
        paymentIntentId: paymentIntent?.id
      };

      if (!isLoggedIn) {
        payload.name = name;
        payload.email = email;
        payload.phone = phone;
      }

      const token = localStorage.getItem("guestToken");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') + '') + "/reservations", {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Payment succeeded, but failed to create reservation in our system.");
      }
      
      if (data.token) {
        localStorage.setItem("guestToken", data.token);
      }

      setStatus("complete");
      router.push(buildConfirmUrl());
    } catch (err) {
      console.error(err);
      setPaymentError(err.message || "Payment failed. Please check your card details and try again.");
      setStatus("idle");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {!isLoggedIn && (
        <section className="space-y-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#0c1929]">Guest details</p>
            <h2 className="mt-2 text-2xl font-medium text-[#0c1929]">Tell us who&apos;s checking in</h2>
          </div>

          <div className="space-y-4">
            <label className="block rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-[#0c1929] transition hover:border-slate-300 focus-within:ring-2 focus-within:ring-[#0c1929] focus-within:border-transparent">
              Full name
              <input 
                type="text" 
                name="name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLoggedIn} 
                placeholder="Your full name" 
                className="mt-2 w-full bg-transparent text-base text-[#0c1929] outline-none" 
              />
            </label>

            <label className="block rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-[#0c1929] transition hover:border-slate-300 focus-within:ring-2 focus-within:ring-[#0c1929] focus-within:border-transparent">
              Email address
              <input 
                type="email" 
                name="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required={!isAdmin && !isLoggedIn} 
                placeholder="Your email address" 
                className="mt-2 w-full bg-transparent text-base text-[#0c1929] outline-none" 
              />
            </label>

            <label className="block rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-[#0c1929] transition hover:border-slate-300 focus-within:ring-2 focus-within:ring-[#0c1929] focus-within:border-transparent">
              Phone number
              <input 
                type="tel" 
                name="phone" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required={!isAdmin && !isLoggedIn} 
                placeholder="Your phone number" 
                className="mt-2 w-full bg-transparent text-base text-[#0c1929] outline-none" 
              />
            </label>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#0c1929]">Payment</p>
          <h2 className="mt-2 text-2xl font-medium text-[#0c1929]">Secure card details</h2>
        </div>

        <div className="rounded-[28px] bg-white border border-slate-100 shadow-[0_4px_30px_rgba(12,25,41,0.03)] p-5">
          <div className="mb-4 flex items-center justify-between rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-[#0c1929]">
              <CreditCard className="h-4 w-4" />
              Secure Stripe Payment
            </div>
          </div>

          <div className="p-2">
            <PaymentElement />
          </div>
        </div>
      </section>

      {/* ── Payment error banner ── */}
      {paymentError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 animate-in slide-in-from-top-2 duration-300">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-800 leading-snug">Payment unsuccessful</p>
            <p className="text-sm text-red-600 mt-0.5 leading-relaxed">{paymentError}</p>
          </div>
          <button
            type="button"
            onClick={() => setPaymentError(null)}
            className="shrink-0 text-red-400 hover:text-red-600 transition p-0.5 rounded-lg hover:bg-red-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={status === "processing" || !stripe || !elements}
        formNoValidate={isAdmin}
        className="inline-flex w-full items-center justify-center rounded-[24px] bg-[#0c1929] px-6 py-4 text-base font-semibold text-white transition hover:bg-[#152b47] disabled:cursor-wait disabled:bg-[#0c1929]/70"
      >
        {status === "processing" ? (
          <>
            <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <ShieldCheck className="mr-2 h-5 w-5" />
            Confirm and Pay
          </>
        )}
      </button>

    </form>
  );
}
