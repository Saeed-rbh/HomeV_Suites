/**
 * Next.js robots.js — automatically served at /robots.txt
 * Allows indexing of public pages, blocks private/admin/transactional routes.
 */
export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/listing/", "/search"],
        disallow: [
          "/admin/",
          "/checkout",
          "/booking-confirmed",
          "/trips",
          "/login",
          "/dev-login",
          "/success",
          "/receipt/",
          "/api/",
        ],
      },
    ],
    sitemap: "https://homev.ca/sitemap.xml",
  };
}
