import TripsPageClient from "@/components/TripsPageClient";

export const metadata = {
  title: "My Trips",
  description: "View and manage your upcoming and past HomEV reservations.",
  robots: { index: false, follow: false },
};


export default function TripsPage() {
  return <TripsPageClient />;
}
