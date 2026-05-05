const propertyService = require('../services/propertyService');
const { fetchGlobalData, fetchPropertyData } = require('../services/uplistingService');
const prisma = require('../db');
const { parseUplistingIncludes, buildAddress, mapCancellationPolicy } = require('../utils/parseUplistingIncludes');
const { handleError } = require('../utils/errorHandler');

// ── In-Memory Calendar Cache ──────────────────────────────────────────────────
// Avoids firing one Uplisting API call per property on every page load.
// Each entry expires after 5 minutes. Invalidated by booking webhooks.
const calendarCache = new Map(); // key: propertyId → { data, expiresAt }
const CALENDAR_TTL_MS = 5 * 60 * 1000; // 5 minutes

const getCachedCalendar = async (propertyId) => {
    const cached = calendarCache.get(propertyId);
    if (cached && Date.now() < cached.expiresAt) return cached.data;
    const fresh = await fetchPropertyData(propertyId, `/calendar/${propertyId}`);
    calendarCache.set(propertyId, { data: fresh, expiresAt: Date.now() + CALENDAR_TTL_MS });
    return fresh;
};

// Exported so webhookRoutes can bust the cache when a booking is created
const bustCalendarCache = (propertyId) => {
    calendarCache.delete(propertyId);
    console.log(`[CalendarCache] Busted cache for property ${propertyId}`);
};

// ── Shared calendar data parser ───────────────────────────────────────────────
const parseCalendarData = (calRes) => {
    const days = calRes.data?.calendar?.days || [];
    const blockedDates = days.filter(d => !d.available).map(d => d.date);
    const prices = days.map(d => parseFloat(d.day_rate)).filter(p => !isNaN(p) && p > 0);
    const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 250.0;
    const minStays = days.map(d => d.minimum_length_of_stay || d.min_los).filter(m => m != null && m > 0);
    const minStay = minStays.length > 0 ? Math.min(...minStays) : 1;
    const calendarRates = {};
    const calendarMinStays = {};
    for (const d of days) {
        if (d.date && d.day_rate != null) calendarRates[d.date] = parseFloat(d.day_rate);
        if (d.date && (d.minimum_length_of_stay || d.min_los)) calendarMinStays[d.date] = d.minimum_length_of_stay || d.min_los;
    }
    return { blockedDates, avgPrice, minStay, calendarRates, calendarMinStays };
};

// ── Shared property attribute mapper ─────────────────────────────────────────
const mapPropertyAttributes = (item, maps, localProp, calendarData) => {
    const attr = item.attributes || item;
    const { addressMap, photoMap, amenityMap, policyMap, discountMap, feeMap, taxMap, suitabilityMap, securityDepositMap, commissionMap } = maps;

    const addrId = item.relationships?.address?.data?.id;
    const addrData = addrId ? addressMap[addrId] : null;
    const fullAddress = buildAddress(addrData);

    // Photos
    let photos = [];
    if (item.relationships?.photos?.data) {
        const photoEntries = item.relationships.photos.data.map(p => photoMap[p.id]).filter(Boolean);
        photoEntries.sort((a, b) => (a.order || 0) - (b.order || 0));
        photos = photoEntries.map(p => p.url);
    }

    // Amenities
    let amenities = [];
    if (item.relationships?.amenities?.data) {
        amenities = item.relationships.amenities.data.map(a => amenityMap[a.id]).filter(Boolean);
    }

    // Cancellation policy (Uplisting then override from local DB)
    let { cancellationType, cancellationDescription, cancellationDays } = mapCancellationPolicy(
        item.relationships?.policy?.data?.id ? policyMap[item.relationships.policy.data.id] : null
    );
    let combinedPolicy = null;
    if (localProp && (localProp.shortTermPolicy || localProp.longTermPolicy)) {
        combinedPolicy = { shortTerm: localProp.shortTermPolicy, longTerm: localProp.longTermPolicy, ...(localProp.shortTermPolicy || {}) };
        if (localProp.shortTermPolicy) {
            cancellationType = localProp.shortTermPolicy.name + ' cancellation policy';
            cancellationDays = localProp.shortTermPolicy.fullRefundDaysPrior;
        }
    }

    // Discounts
    let discounts = { weekly: 0, monthly: 0 };
    if (item.relationships?.discounts?.data) {
        item.relationships.discounts.data.forEach(dRel => {
            const d = discountMap[dRel.id];
            if (d && d.type === 'percentage') {
                if (d.days === 7 || d.label === 'weekly') discounts.weekly = parseInt(d.amount);
                if (d.days === 28 || d.label === 'monthly') discounts.monthly = parseInt(d.amount);
            }
        });
    }

    // Fees, taxes, suitability, security deposit, channel commissions
    const fees = item.relationships?.fees?.data?.map(f => feeMap[f.id]).filter(Boolean) || [];
    const cleaningFeeEntry = fees.find(f => f.label === 'cleaning_fee' && f.enabled);
    const cleaningFee = cleaningFeeEntry ? parseFloat(cleaningFeeEntry.amount) : 0;

    const taxes = item.relationships?.taxes?.data?.map(t => taxMap[t.id]).filter(Boolean) || [];
    let taxRate = 0;
    let taxFixedPerBooking = 0;
    let taxFixedPerNight = 0;
    let taxFixedPerPersonPerNight = 0;

    for (const t of taxes) {
        const amt = parseFloat(t.amount) || 0;
        if (amt === 0) continue;
        if (t.label === 'per_booking_percentage' && t.type === 'percentage') {
            taxRate = amt / 100;
        } else if (t.label === 'per_booking_amount' && t.type === 'fixed') {
            taxFixedPerBooking = amt;
        } else if (t.label === 'per_night' && t.type === 'fixed') {
            taxFixedPerNight = amt;
        } else if (t.label === 'per_person_per_night' && t.type === 'fixed') {
            taxFixedPerPersonPerNight = amt;
        }
    }
    let suitability = { children: true, pets: false, events: false, smoking: false };
    if (item.relationships?.suitability?.data?.id) {
        const suit = suitabilityMap[item.relationships.suitability.data.id];
        if (suit) suitability = suit;
    }
    let securityDeposit = { amount: 0, enabled: false };
    if (item.relationships?.protect_security_deposit_setting?.data?.id) {
        const dep = securityDepositMap[item.relationships.protect_security_deposit_setting.data.id];
        if (dep) securityDeposit = { amount: dep.amount, enabled: dep.enabled };
    }
    const channelCommissions = item.relationships?.channel_commissions?.data?.map(c => commissionMap[c.id]).filter(Boolean) || [];

    const { blockedDates, avgPrice, minStay, calendarRates, calendarMinStays } = calendarData;

    return {
        id: item.id || String(Math.random()),
        title: attr.name || attr.nickname || 'Uplisting Property',
        description: attr.description || 'Synced from Uplisting',
        address: fullAddress,
        images: photos,
        amenities,
        blockedDates,
        calendarRates,
        calendarMinStays,
        pricePerNight: avgPrice,
        capacity: attr.maximum_capacity ? parseInt(attr.maximum_capacity) : 4,
        bedrooms: attr.bedrooms ? parseInt(attr.bedrooms) : 2,
        bathrooms: attr.bathrooms ?? 1,
        beds: attr.beds ?? 0,
        bedTypes: attr.bed_types || [],
        currency: attr.currency || 'CAD',
        timeZone: attr.time_zone || 'America/Toronto',
        propertyType: attr.type || 'Apartment',
        checkInTime: attr.check_in_time ?? 15,
        checkOutTime: attr.check_out_time ?? 11,
        nickname: attr.nickname || '',
        createdAt: attr.created_at || '',
        uplistingDomain: attr.uplisting_domain || '',
        propertySlug: attr.property_slug || '',
        city: addrData?.city || 'Toronto',
        state: addrData?.state || 'ON',
        zipCode: addrData?.zip_code || '',
        country: addrData?.country || 'Canada',
        latitude: addrData?.latitude || null,
        longitude: addrData?.longitude || null,
        minStay,
        discounts,
        fees,
        taxes,
        cleaningFee,
        taxRate,
        taxFixedPerBooking,
        taxFixedPerNight,
        taxFixedPerPersonPerNight,
        suitability,
        securityDeposit,
        channelCommissions,
        cancellationType,
        cancellationDescription,
        cancellationDays,
        cancellationPolicy: combinedPolicy
    };
};

// ── Controllers ───────────────────────────────────────────────────────────────

const syncProperties = async (req, res) => {
    console.log('[Sync] 🔄 Manual property sync triggered');
    try {
        const response = await fetchGlobalData('/properties');
        const uplistingProperties = response.data.data || response.data;
        const included = response.data.included || [];
        console.log(`[Sync] Received ${uplistingProperties.length} properties from Uplisting`);

        const { addressMap } = parseUplistingIncludes(included);

        let syncedCount = 0;
        for (const item of uplistingProperties) {
            const attr = item.attributes || item;
            const addrId = item.relationships?.address?.data?.id;
            const addrData = addrId ? addressMap[addrId] : null;
            const fullAddress = buildAddress(addrData);

            const propData = {
                id: item.id || String(Math.random()),
                title: attr.name || attr.nickname || 'Uplisting Property',
                description: attr.description || 'Synced from Uplisting',
                address: fullAddress,
                pricePerNight: attr.default_daily_rate ? parseFloat(attr.default_daily_rate) : 250.0,
                capacity: attr.maximum_capacity ? parseInt(attr.maximum_capacity) : 4,
                bedrooms: attr.bedrooms ? parseInt(attr.bedrooms) : 2
            };

            try {
                await propertyService.upsertProperty(propData);
                syncedCount++;
                console.log(`[Sync] ✅ Upserted property "${propData.title}" (${propData.id})`);
            } catch (upsertErr) {
                console.error(`[Sync] ❌ Failed to upsert "${propData.title}" (${propData.id}):`, upsertErr.message);
            }
        }

        console.log(`[Sync] 🏁 Sync complete — ${syncedCount}/${uplistingProperties.length} properties synced`);
        res.status(200).json({ success: true, message: `Successfully synced ${syncedCount} properties from Uplisting.` });
    } catch (error) {
        console.error('[Sync] ❌ SYNC FAILED:', error.response?.data || error.message);
        handleError(res, error, 'syncProperties');
    }
};

const createProperty = async (req, res) => {
    try {
        const property = await propertyService.createProperty(req.body);
        res.status(201).json({ success: true, data: property });
    } catch (error) {
        handleError(res, error, 'createProperty', 400);
    }
};

const getProperties = async (req, res) => {
    try {
        const response = await fetchGlobalData('/properties?include=photos,amenities,addresses,fees,taxes,discounts');
        const uplistingProperties = response.data.data || response.data;

        if (!uplistingProperties || uplistingProperties.length === 0) {
            console.log('[Uplisting API] No properties returned, falling back to database...');
            const dbProperties = await propertyService.getProperties(req.query);
            return res.status(200).json({ success: true, data: dbProperties });
        }

        const maps = parseUplistingIncludes(response.data.included || []);

        // Fetch local policies mapping
        const localProps = await prisma.property.findMany({ include: { shortTermPolicy: true, longTermPolicy: true } });
        const localPropMap = Object.fromEntries(localProps.map(p => [p.externalId || p.id, p]));

        const properties = await Promise.all(uplistingProperties.map(async (item) => {
            let calendarData = { blockedDates: [], avgPrice: 250.0, minStay: 1, calendarRates: {}, calendarMinStays: {} };
            try {
                const calRes = await getCachedCalendar(item.id);
                calendarData = parseCalendarData(calRes);
            } catch (calErr) {
                console.error(`[Uplisting API] Calendar fetch failed for ${item.id}`);
            }
            const localProp = localPropMap[item.id];
            return mapPropertyAttributes(item, maps, localProp, calendarData);
        }));

        res.status(200).json({ success: true, data: properties });
    } catch (error) {
        console.error('Direct Proxy Failed, falling back to DB', error.message);
        try {
            const properties = await propertyService.getProperties(req.query);
            res.status(200).json({ success: true, data: properties });
        } catch (dbErr) {
            handleError(res, dbErr, 'getProperties', 400);
        }
    }
};

const getPropertyById = async (req, res) => {
    try {
        const propId = req.params.id;
        const response = await fetchPropertyData(propId, `/properties/${propId}?include=photos,amenities,addresses,fees,taxes,discounts`);
        const uplistingProperty = response.data.data || response.data;
        const maps = parseUplistingIncludes(response.data.included || []);

        let calendarData = { blockedDates: [], avgPrice: 250.0, minStay: 1, calendarRates: {}, calendarMinStays: {} };
        try {
            const calRes = await getCachedCalendar(propId);
            calendarData = parseCalendarData(calRes);
        } catch (calErr) {
            console.error(`[Uplisting API] Calendar fetch failed for ${propId}`);
        }

        const localProp = await prisma.property.findUnique({
            where: { id: propId },
            include: { shortTermPolicy: true, longTermPolicy: true }
        });

        const property = mapPropertyAttributes(uplistingProperty, maps, localProp, calendarData);
        res.status(200).json({ success: true, data: property });
    } catch (error) {
        console.error('Direct Proxy Failed for single property, falling back to DB', error.message);
        try {
            const property = await propertyService.getPropertyById(req.params.id);
            if (!property) return res.status(404).json({ success: false, error: 'Property not found' });
            res.status(200).json({ success: true, data: property });
        } catch (dbErr) {
            handleError(res, dbErr, 'getPropertyById', 400);
        }
    }
};

const getInternalPropertyById = async (propId) => {
    try {
        const response = await fetchPropertyData(propId, `/properties/${propId}?include=photos,amenities,addresses,fees,taxes,discounts`);
        const uplistingProperty = response.data.data || response.data;
        if (!uplistingProperty) return null;
        const maps = parseUplistingIncludes(response.data.included || []);

        let calendarData = { blockedDates: [], avgPrice: 250.0, minStay: 1, calendarRates: {}, calendarMinStays: {} };
        try {
            const calRes = await getCachedCalendar(propId);
            calendarData = parseCalendarData(calRes);
        } catch (calErr) {
            console.error(`[Uplisting API] Calendar fetch failed for ${propId}`);
        }

        const localProp = await prisma.property.findUnique({
            where: { id: propId },
            include: { shortTermPolicy: true, longTermPolicy: true }
        });

        return mapPropertyAttributes(uplistingProperty, maps, localProp, calendarData);
    } catch (error) {
        console.error('Direct Proxy Failed for internal property fetch, falling back to DB', error.message);
        try {
            const property = await propertyService.getPropertyById(propId);
            return property;
        } catch (dbErr) {
            return null;
        }
    }
};

const updateProperty = async (req, res) => {
    try {
        const property = await propertyService.updateProperty(req.params.id, req.body);
        res.status(200).json({ success: true, data: property });
    } catch (error) {
        handleError(res, error, 'updateProperty', 400);
    }
};

const deleteProperty = async (req, res) => {
    try {
        await propertyService.deleteProperty(req.params.id);
        res.status(200).json({ success: true, message: 'Property deleted' });
    } catch (error) {
        handleError(res, error, 'deleteProperty', 400);
    }
};

module.exports = {
    syncProperties,
    createProperty,
    getProperties,
    getPropertyById,
    getInternalPropertyById,
    updateProperty,
    deleteProperty,
    bustCalendarCache
};
