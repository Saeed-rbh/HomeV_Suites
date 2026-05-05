# Uplisting API: Development Capabilities & Implementation Guide

Based on the official **Uplisting API [Public]** documentation, here is a comprehensive breakdown of what Uplisting offers for developers and how each feature can be implemented.

## 1. Real-time Webhooks (Push Notifications)
The API provides a robust webhook system to notify your application of real-time changes, avoiding the need for constant polling.

### What it offers:
- **Booking Events:** `booking_created`, `booking_updated`, `booking_removed`.
- **Property Events:** `property_created`, `property_updated`, `property_removed`.

### How to implement:
- **Registration:** Send a `POST` request to `https://connect.uplisting.io/hooks` with a `target_url` (your endpoint) and the specific `event` you want to listen to.
- **Handling Payloads:** Your endpoint must return a `200 OK` response within **5 seconds** to prevent timeouts. Process the actual payload asynchronously to avoid blocking the response.
- **Data Integrity (Crucial):** Since webhooks can arrive out of order or duplicate, you **must** handle them idempotently. Always check the `timestamp` attribute in the payload; if the timestamp is older than the last processed event for that ID, discard it to prevent writing stale data.
- **Deregistration:** Use `DELETE /hooks/:id` to unsubscribe from an event.

## 2. Custom Booking Attributes
Developers can extend the standard booking model with custom metadata specific to their application or partner integration.

### What it offers:
- Creation of up to 15 custom attributes per partner account (e.g., passing custom access codes, partner IDs, etc.).
- These attributes can be seamlessly injected into Uplisting's automated guest messages using special tags.

### How to implement:
- **Creation:** Send a `POST` to `/v2/custom_booking_attributes` with a namespaced attribute name (e.g., `partnername_lock_code`).
- **Updating:** Use `PATCH /v2/bookings/:id` to set or update these custom attribute values for a specific booking.
- *Note:* Requires a specialized `X-Uplisting-Client-Id` header assigned by the Uplisting partner team.

## 3. Calendar & Availability Management
Uplisting allows full programmatic control over property calendars, rates, and stay restrictions.

### What it offers:
- **Calendar Reads:** Retrieve availability, daily rates, minimum length of stay (MLOS), and arrival/departure restrictions for up to 12 months.
- **Calendar Updates:** Bulk update availability, prices, and restrictions.
- **Availability Search:** Search across all properties for availability matching specific criteria (dates, guests, price range, city).

### How to implement:
- **Read Calendar:** `GET /calendar/:listing_id?from=YYYY-MM-DD&to=YYYY-MM-DD` to fetch daily calendar blocks.
- **Search Availability:** `GET /availability` with query parameters like `check_in`, `check_out`, `min_price`, etc.
- **Update Calendar:** `POST /calendar/:listing_id` to push a bulk array of date updates. **Important:** This is an asynchronous operation. You should include a `notification_url` in the request body; Uplisting will send an asynchronous callback (usually within 1 minute) to this URL confirming the success or failure of the calendar update.

## 4. Property Data Synchronization
Retrieve comprehensive listing data for building booking engines or property management dashboards.

### What it offers:
- Deep access to property records including addresses, high-res photos, multi-units, amenities, house suitabilities, cancellation policies, and channel commissions.
- Access to financial configurations: Taxes, Cleaning Fees, Extra Guest Charges, and Length-of-Stay Discounts.

### How to implement:
- **List All:** `GET /properties` to sync all properties. Sideloaded data is returned using JSON API specification relationships (e.g., related entities are listed under `"included"`).
- **Single Property:** `GET /properties/:id` to fetch or refresh data for a specific property. When receiving a `property_updated` webhook, call this endpoint to fetch the fresh property state.

## 5. Booking Creation and Retrieval
Manage the complete lifecycle of bookings.

### What it offers:
- Create new confirmed bookings directly via the API.
- Retrieve paginated lists of past, present, and future bookings for a specific property.

### How to implement:
- **Read Bookings:** `GET /bookings/:listing_id` using `from` and `to` query parameters. Supports pagination via `page` and `per_page`.
- **Create Booking:** `POST /v2/bookings` passing required fields (`check_in`, `check_out`, `property_id`) and optional guest data (`guest_name`, `guest_email`, `guest_phone`, `number_of_guests`).

---

### General Implementation Best Practices
1. **Authentication:** All requests use Basic Auth by passing a Base64 encoded API Key in the `Authorization` header.
2. **Rate Limiting:** Adhere to limits of 5 req/s per IP, 100 req/min per IP, and 15 req/min per property. Implement retry logic for `429 Too Many Requests` responses.
3. **Architecture:** Use a webhook-first architecture. Fetch a "snapshot" of properties and bookings initially using the `GET` endpoints, then rely exclusively on webhooks (`POST /hooks`) to keep your local database synchronized with Uplisting.
