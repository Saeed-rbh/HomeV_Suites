// Safe server-side fetch to backend Uplisting sync endpoint
export async function getListingByIdDynamic(id) {
  if (!id) return null;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api') + ''}/properties/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    
    const payload = await res.json();
    const p = payload.data;
    if (!p) return null;

    // Format check-in/out times as human readable strings
    const formatTime = (hour) => {
      if (hour == null) return null;
      const h = parseInt(hour);
      const suffix = h >= 12 ? 'p.m.' : 'a.m.';
      const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
      return `${display}:00 ${suffix}`;
    };

    const checkInTimeStr = formatTime(p.checkInTime ?? 15);
    const checkOutTimeStr = formatTime(p.checkOutTime ?? 11);

    // Build suitability-aware rules
    const suit = p.suitability || { children: true, pets: false, events: false, smoking: false };
    const duringYourStay = [`${p.capacity || 2} guests maximum`];
    if (!suit.pets) duringYourStay.push("No pets");
    if (!suit.events) duringYourStay.push("No parties or events");
    if (!suit.smoking) duringYourStay.push("No smoking");

    const safetyDevices = [];
    const safetySummary = [];
    const amenityNames = (p.amenities || []).map(a => (a.name || '').toLowerCase());
    if (amenityNames.some(n => n.includes('carbon monoxide'))) {
      safetyDevices.push({ title: "Carbon monoxide alarm installed", description: "" });
      safetySummary.push("Carbon monoxide alarm");
    }
    if (amenityNames.some(n => n.includes('smoke detector') || n.includes('smoke alarm'))) {
      safetyDevices.push({ title: "Smoke alarm installed", description: "" });
      safetySummary.push("Smoke alarm");
    }
    if (!suit.children) {
      safetySummary.push("Not suitable for children and infants");
    }

    // Build cleaning fee from fees array
    const cleaningFeeEntry = (p.fees || []).find(f => f.label === 'cleaning_fee' && f.enabled);
    const cleaningFee = cleaningFeeEntry ? cleaningFeeEntry.amount : 0;

    // Compute tax fields from the taxes array (API returns per-property tax config)
    const taxesArr = p.taxes || [];
    let taxRate = 0;               // percentage tax as decimal (e.g. 0.13 for 13%)
    let taxFixedPerBooking = 0;    // flat $ per booking
    let taxFixedPerNight = 0;      // flat $ per night
    let taxFixedPerPersonPerNight = 0; // flat $ per person per night

    for (const t of taxesArr) {
      const amt = parseFloat(t.amount) || 0;
      if (amt === 0) continue;
      if (t.label === 'per_booking_percentage' && t.type === 'percentage') {
        taxRate = amt / 100; // API stores as integer percentage (e.g. 13 → 0.13)
      } else if (t.label === 'per_booking_amount' && t.type === 'fixed') {
        taxFixedPerBooking = amt;
      } else if (t.label === 'per_night' && t.type === 'fixed') {
        taxFixedPerNight = amt;
      } else if (t.label === 'per_person_per_night' && t.type === 'fixed') {
        taxFixedPerPersonPerNight = amt;
      }
    }

    // Map database shape to Frontend specific shape seamlessly
    return {
      ...p,
      neighborhood: p.city || "Toronto",
      location: `${p.city || 'Toronto'}, ${p.state || 'Ontario'}`,
      latitude: p.latitude || 43.6703,
      longitude: p.longitude || -79.3916,
      images: p.images?.length > 0 ? p.images : [
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80",
        "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80"
      ],
      price: p.pricePerNight || 200,
      baths: p.bathrooms ?? 1,
      beds: p.beds ?? 0,
      bedTypes: p.bedTypes || [],
      currency: p.currency || 'CAD',
      propertyType: p.propertyType || 'Apartment',
      checkInTime: p.checkInTime ?? 15,
      checkOutTime: p.checkOutTime ?? 11,
      checkInTimeStr,
      checkOutTimeStr,
      specs: `${p.bedrooms || 1} Bed${(p.bedrooms || 1) !== 1 ? 's' : ''}, ${p.bathrooms ?? 1} Bath${(p.bathrooms ?? 1) !== 1 ? 's' : ''}`,
      rating: 4.8,
      reviews: Math.floor(Math.random() * 200) + 20,
      maxGuests: p.capacity || 4,
      host: "HomEV Team",
      description: p.description || "A gorgeous stay brought directly from Uplisting.",
      cancellation: p.cancellationDescription || "Flexible cancellation for synced Uplisting reservations.",
      amenities: p.amenities?.length > 0 
        ? p.amenities.map(a => ({
            id: a.id || a.name?.toLowerCase().replace(/[^a-z0-9]/g, ''),
            name: a.name || a,
            group: a.group || "Amenities"
          }))
        : [
            { id: "wifi", name: "Fast WiFi", group: "Popular Amenities" },
            { id: "kitchen", name: "Chef kitchen", group: "Kitchen & Dining" },
            { id: "workspace", name: "Dedicated workspace", group: "Popular Amenities" },
            { id: "parking", name: "On-site parking", group: "Popular Amenities" },
            { id: "selfCheckIn", name: "Self check-in", group: "Popular Amenities" }
          ],
      blockedDates: p.blockedDates || [],
      calendarRates: p.calendarRates || {},
      calendarMinStays: p.calendarMinStays || {},
      minNights: p.minStay || 2,
      discounts: p.discounts || { weekly: 6, monthly: 10 },
      fees: p.fees || [],
      taxes: p.taxes || [],
      cleaningFee,
      taxRate,
      taxFixedPerBooking,
      taxFixedPerNight,
      taxFixedPerPersonPerNight,
      suitability: suit,
      securityDeposit: p.securityDeposit || { amount: 0, enabled: false },
      channelCommissions: p.channelCommissions || [],
      city: p.city || 'Toronto',
      state: p.state || 'ON',
      zipCode: p.zipCode || '',
      country: p.country || 'Canada',
      thingsToKnow: {
        houseRules: {
          summary: [
            `Check-in after ${checkInTimeStr}`,
            `Checkout before ${checkOutTimeStr}`,
            `${p.capacity || 2} guests maximum`
          ],
          checkingInAndOut: [
            `Check-in after ${checkInTimeStr}`,
            `Checkout before ${checkOutTimeStr}`
          ],
          duringYourStay,
          additionalRules: [
            "All rental guests must check-in with the Concierge upon arrival",
            "All rental guests must present proper photo identification at the time of check-in with the Concierge",
            "The Concierge will not be providing access, all access needs will be between the host and guest.",
            "The Concierge will not accept or hold any packages, food deliveries, groceries or any other matter of deliveries.",
            "The Concierge will not provide access to units when guests have lost the keys.",
            "No bicycles or personal scooters are permitted to be taken inside the elevators.",
            "No parties or excessive noise permitted.",
            "No smoking or vaping of any kind is permitted on the property.",
            "No dog weight greater than 10 kilograms shall be kept or allowed in any Residential Unit. It must remain on a leash all the time."
          ]
        },
        safety: {
          summary: safetySummary,
          safetyConsiderations: !suit.children ? [
            {
              title: "Not suitable for children and infants",
              description: "No children allowed"
            }
          ] : [],
          safetyDevices
        },
        cancellationPolicy: {
          summary: p.cancellationDescription || "Free cancellation before the deadline. Review host's full policy for details.",
          details: "Review this host's full policy for details.",
          timeline: [
            {
              phase: "Before",
              date: "deadline",
              time: checkInTimeStr,
              title: "Full refund",
              description: `Get back 100% of what you paid. (Policy: ${p.cancellationType || 'Standard'})`
            }
          ]
        }
      }
    };
  } catch (err) {
    console.error("Failed to dynamically fetch listing:", id, err);
    return null;
  }
}
