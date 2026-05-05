# Uplisting API — Complete Data Reference
> Generated: April 24, 2026  
> Base URL: `https://connect.uplisting.io`  
> Auth: Basic Auth → `Authorization: Basic <Base64(API_KEY:)>`  
> Rate Limits: 5 req/s per IP, 100 req/min per IP, 15 req/min per property

---

## 1. VERIFY API KEY

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Endpoint** | `/users/me` |
| **Purpose** | Confirm API key is valid and return user metadata |

### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | User ID |
| `type` | string | Always `"users"` |
| `attributes.email` | string | Account email |
| `attributes.first_name` | string | First name |
| `attributes.last_name` | string | Last name |

---

## 2. LIST ALL PROPERTIES

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Endpoint** | `/properties` |
| **Include** | `?include=photos,amenities,addresses,fees,taxes,discounts` |
| **Purpose** | Returns all properties linked to your account |

### Property Attributes (under `data[].attributes`)
| Field | Type | Description | ✅ Used |
|-------|------|-------------|---------|
| `name` | string | Property display name | ✅ → `title` |
| `nickname` | string | Internal nickname | ✅ fallback for `title` |
| `description` | string | Full text description | ✅ → `description` |
| `bedrooms` | integer | Number of bedrooms | ✅ → `bedrooms` |
| `bathrooms` | float | Number of bathrooms | ✅ → `bathrooms` |
| `beds` | integer | Number of beds | ✅ → `beds` |
| `maximum_capacity` | integer | Max guest count | ✅ → `capacity` |
| `default_daily_rate` | decimal | Default nightly price | ✅ → `pricePerNight` |
| `currency` | string | Currency code (e.g. `"CAD"`) | ✅ → `currency` |
| `property_type` | string | Type (e.g. `"Apartment"`, `"House"`) | ✅ → `propertyType` |
| `room_type` | string | Room type (e.g. `"Entire home/apt"`) | ❌ not in API response |
| `check_in_time` | string | Default check-in time (e.g. `"15:00"`) | ✅ → `checkInTime` |
| `check_out_time` | string | Default check-out time (e.g. `"11:00"`) | ✅ → `checkOutTime` |
| `minimum_stay` | integer | Minimum nights for a booking | ✅ → `minStay` (from calendar) |
| `maximum_stay` | integer | Maximum nights for a booking | ❌ not in API response |
| `house_rules` | string | House rules text | ❌ not in API response |
| `neighborhood_overview` | string | Area/neighborhood description | ❌ not in API response |
| `transit` | string | Transit/transportation info | ❌ not in API response |
| `interaction` | string | Host interaction details | ❌ not in API response |
| `notes` | string | Additional notes | ❌ not in API response |
| `space` | string | Space description | ❌ not in API response |
| `access` | string | Guest access description | ❌ not in API response |
| `manual` | string | House manual details | ❌ not in API response |
| `wifi_network` | string | WiFi network name | ❌ not in API response |
| `wifi_password` | string | WiFi password | ❌ not in API response |
| `created_at` | datetime | Creation timestamp | ✅ → `createdAt` |
| `updated_at` | datetime | Last update timestamp | ❌ not in API response |

### Property Relationships (under `data[].relationships`)
| Relationship | Type | Description | ✅ Used |
|-------------|------|-------------|---------|
| `address` | has-one | Physical address | ✅ |
| `photos` | has-many | Photo gallery | ✅ |
| `amenities` | has-many | Amenity list | ✅ |
| `fees` | has-many | Extra fees (cleaning, etc.) | ✅ → `fees` |
| `taxes` | has-many | Tax configurations | ✅ → `taxes` |
| `policy` | has-one | Cancellation policy | ✅ |
| `discounts` | has-many | Length-of-stay discounts | ✅ |

---

## 3. SIDELOADED RESOURCES (via `?include=`)

### 3a. Address (`type: "addresses"`)
| Field | Type | Description | ✅ Used |
|-------|------|-------------|---------|
| `street` | string | Street address | ✅ |
| `suite` | string | Suite/unit number | ✅ |
| `city` | string | City name | ✅ |
| `state` | string | State/province | ✅ |
| `zip_code` | string | Postal/zip code | ✅ |
| `country` | string | Country name | ✅ |
| `latitude` | float | Latitude coordinate | ✅ → `latitude` |
| `longitude` | float | Longitude coordinate | ✅ → `longitude` |

### 3b. Photos (`type: "photos"`)
| Field | Type | Description | ✅ Used |
|-------|------|-------------|---------|
| `url` | string | Full image URL | ✅ |
| `caption` | string | Photo caption | ❌ not in API response |
| `position` | integer | Display order | ✅ sorted by `order` |

### 3c. Amenities (`type: "amenities"`)
| Field | Type | Description | ✅ Used |
|-------|------|-------------|---------|
| `name` | string | Amenity name (e.g. "WiFi") | ✅ |
| `group` | string | Category group (e.g. "Bathroom") | ✅ |
| `category_name` | string | Alternative category field | ✅ fallback |

### 3d. Fees (`type: "fees"`)
| Field | Type | Description | ✅ Used |
|-------|------|-------------|---------|
| `name` | string | Fee name (e.g. "Cleaning fee") | ✅ |
| `amount` | decimal | Fee amount | ✅ |
| `type` | string | Fee type (flat, percentage) | ✅ |
| `frequency` | string | When charged (per stay, per night) | ✅ |

### 3e. Taxes (`type: "taxes"`)
| Field | Type | Description | ✅ Used |
|-------|------|-------------|---------|
| `name` | string | Tax name | ✅ |
| `amount` | decimal | Tax amount or percentage | ✅ |
| `type` | string | Tax type | ✅ |
| `included_in_price` | boolean | Whether included in display price | ✅ |

### 3f. Policy (`type: "policies"`)
| Field | Type | Description | ✅ Used |
|-------|------|-------------|---------|
| `type` | string | Policy name (e.g. "Strict cancellation policy") | ✅ |
| `description` | string | Full policy description text | ✅ |

### 3g. Discounts (`type: "property_discounts"`)
| Field | Type | Description | ✅ Used |
|-------|------|-------------|---------|
| `name` | string | Discount name (e.g. "Weekly discount") | ❌ |
| `label` | string | `"weekly"` or `"monthly"` | ✅ |
| `type` | string | Discount type (`"percentage"`) | ✅ |
| `days` | integer | Minimum nights to trigger (7 or 28) | ✅ |
| `amount` | integer | Discount percentage | ✅ |

---

## 4. SINGLE PROPERTY DETAIL

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Endpoint** | `/properties/:id` |
| **Include** | `?include=photos,amenities,addresses,fees,taxes,discounts` |
| **Purpose** | Full detail for one property (same attributes as above) |

---

## 5. AVAILABILITY SEARCH

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Endpoint** | `/availability` |
| **Purpose** | Search for available properties by dates, guests, price, city |

### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `check_in` | date (YYYY-MM-DD) | Check-in date |
| `check_out` | date (YYYY-MM-DD) | Check-out date |
| `number_of_guests` | integer | Number of guests |
| `min_price` | decimal | Minimum nightly price filter |
| `max_price` | decimal | Maximum nightly price filter |
| `city` | string | City name filter |

### Response
Returns an array of available properties matching the criteria (same structure as List Properties).

---

## 6. BOOKINGS

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Endpoint** | `/bookings/:listing_id` |
| **Purpose** | Retrieve bookings for a specific property (paginated) |

### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number for pagination |
| `start_date` | date | Filter bookings from this date |
| `end_date` | date | Filter bookings up to this date |

### Booking Attributes (under `data[].attributes`)
| Field | Type | Description |
|-------|------|-------------|
| `check_in` | date | Check-in date |
| `check_out` | date | Check-out date |
| `status` | string | `"confirmed"`, `"checked_in"`, `"checked_out"`, `"cancelled"` |
| `guest_name` | string | Guest's name |
| `guest_email` | string | Guest's email |
| `guest_phone` | string | Guest's phone |
| `number_of_guests` | integer | Guest count |
| `total_price` | decimal | Total booking price |
| `currency` | string | Currency code |
| `channel` | string | Booking channel (e.g. "airbnb", "direct") |
| `confirmation_code` | string | Channel confirmation code |
| `notes` | string | Internal notes |
| `created_at` | datetime | Booking creation date |
| `updated_at` | datetime | Last booking update |

---

## 7. CALENDAR (Read)

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **Endpoint** | `/calendar/:listing_id` |
| **Purpose** | Daily availability, rates, and stay restrictions |

### Response: `calendar.days[]`
| Field | Type | Description | ✅ Used |
|-------|------|-------------|---------|
| `date` | date (YYYY-MM-DD) | Calendar date | ✅ |
| `available` | boolean | Whether the date is available | ✅ → `blockedDates` |
| `day_rate` | decimal | Nightly rate for that date | ✅ → `avgPrice` |
| `min_los` | integer | Minimum length of stay | ✅ → `minStay` |
| `closed_for_arrival` | boolean | No check-ins allowed | ❌ |
| `closed_for_departure` | boolean | No check-outs allowed | ❌ |

---

## 8. CALENDAR (Update)

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **Endpoint** | `/calendar/:listing_id` |
| **Purpose** | Bulk update rates and availability |

### Request Body
```json
{
  "dates": [
    {
      "date": "2024-06-15",
      "available": true,
      "day_rate": 299.00,
      "min_los": 2
    }
  ],
  "notification_url": "https://your-webhook.com/callback"
}
```

### Response
| Field | Type | Description |
|-------|------|-------------|
| `request_id` | string | Async tracking ID (202 Accepted) |

---

## LEGEND

| Symbol | Meaning |
|--------|---------|
| ✅ | Currently fetched and mapped in HomEV backend |
| ❌ | Available from API but NOT yet used in HomEV |

---

## FIELDS NOT RETURNED BY API

The following fields are documented in the Uplisting API reference but are **not actually returned** in the current API responses:

- `room_type`, `maximum_stay`, `house_rules`, `neighborhood_overview`, `transit`
- `interaction`, `notes`, `space`, `access`, `manual`
- `wifi_network`, `wifi_password`, `updated_at`
- Photo `caption`
- Calendar `closed_for_arrival`, `closed_for_departure`

These fields may become available in future API versions.
