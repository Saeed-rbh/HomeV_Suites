"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { LoaderCircle } from "lucide-react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function StripeWrapper({ children, listingId, checkIn, checkOut, guests, selectedNonRefundable, currency = "cad" }) {
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!listingId || !checkIn || !checkOut) return;
    
    const fetchClientSecret = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/stripe/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId, checkIn, checkOut, guests, selectedNonRefundable, currency }),
        });
        
        if (!response.ok) {
          throw new Error("Failed to initialize payment.");
        }
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error("Stripe initialization error:", err);
        setError(err.message);
      }
    };
    
    fetchClientSecret();
  }, [listingId, checkIn, checkOut, guests, selectedNonRefundable, currency]);

  if (error) {
    return (
      <div className="rounded-[24px] border border-red-500/25 bg-red-50 p-5 text-sm text-red-600">
        <p>There was a problem preparing your payment: {error}</p>
        <p>Please try again later or contact support.</p>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="flex h-32 items-center justify-center rounded-[30px] border border-slate-100 bg-white shadow-[0_4px_30px_rgba(12,25,41,0.03)] p-8">
        <LoaderCircle className="h-6 w-6 animate-spin text-[#0c1929] mr-2" />
        <span className="text-[#0c1929]">Loading payment details...</span>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#0c1929",
        colorBackground: "#ffffff",
        colorText: "#0c1929",
        colorDanger: "#ef4444",
        fontFamily: "inherit",
        spacingUnit: "4px",
        borderRadius: "20px",
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}
