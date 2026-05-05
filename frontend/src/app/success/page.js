import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export default function SuccessPage() {
  return (
    <div className="flex min-h-[calc(100vh-90px)] items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-[34px] glass-panel p-10 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600 shadow-sm">
          <ShieldCheck className="h-10 w-10" />
        </div>
        <h1 className="text-4xl font-medium tracking-tight text-[#0c1929]">Booking Confirmed!</h1>
        <p className="mx-auto mt-4 max-w-sm text-base leading-7 text-[#0c1929]">
          Your reservation is all set. We have successfully sent the itinerary and deposit receipt to your email address.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-[24px] bg-[#0c1929] px-8 py-4 text-base font-semibold text-white transition hover:bg-[#152b47] shadow-lg shadow-[#0c1929]/20"
        >
          Return to exploration
        </Link>
      </div>
    </div>
  );
}
