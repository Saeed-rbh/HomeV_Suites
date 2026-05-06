const BASE_URL = "https://homev.ca";

/**
 * Next.js dynamic sitemap — automatically discovered at /sitemap.xml
 * Includes the home page and all active listing detail pages.
 */
export default async function sitemap() {
  // Static routes
  const staticRoutes = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  // Dynamic listing routes — fetched from backend
  let listingRoutes = [];
  try {
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const res = await fetch(`${apiBase}/api/properties`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (res.ok) {
      const listings = await res.json();
      listingRoutes = listings.map((listing) => ({
        url: `${BASE_URL}/listing/${listing.id}`,
        lastModified: new Date(listing.updatedAt || Date.now()),
        changeFrequency: "weekly",
        priority: 0.9,
      }));
    }
  } catch (err) {
    // If backend is unreachable during build, skip dynamic routes gracefully
    console.warn("[sitemap] Could not fetch listings:", err.message);
  }

  return [...staticRoutes, ...listingRoutes];
}
