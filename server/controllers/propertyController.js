const propertyService = require('../services/propertyService');
const prisma = require('../db');
const { handleError } = require('../utils/errorHandler');

// Exported so webhookRoutes can bust the cache if needed in future
const bustCalendarCache = (propertyId) => {
    console.log(`[CalendarCache] bust requested for property ${propertyId} (no-op — DB-only mode)`);
};

// ── Controllers ───────────────────────────────────────────────────────────────

const syncProperties = async (req, res) => {
    // Uplisting access has been removed. Properties must be managed directly
    // in the database via the Admin panel or Hostaway's own dashboard.
    res.status(200).json({
        success: true,
        message: 'Sync is disabled — Uplisting access has been removed. Manage properties directly in the database.'
    });
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
        const properties = await propertyService.getProperties(req.query);
        res.status(200).json({ success: true, data: properties });
    } catch (error) {
        handleError(res, error, 'getProperties', 400);
    }
};

const getPropertyById = async (req, res) => {
    try {
        const property = await prisma.property.findFirst({
            where: {
                OR: [
                    { id: req.params.id },
                    { externalId: req.params.id }
                ]
            },
            include: { shortTermPolicy: true, longTermPolicy: true }
        });
        if (!property) return res.status(404).json({ success: false, error: 'Property not found' });

        // Build the combined cancellation policy shape the frontend expects
        let cancellationPolicy = null;
        if (property.shortTermPolicy || property.longTermPolicy) {
            cancellationPolicy = {
                shortTerm: property.shortTermPolicy,
                longTerm: property.longTermPolicy,
                ...(property.shortTermPolicy || {})
            };
        }

        res.status(200).json({
            success: true,
            data: {
                ...property,
                cancellationPolicy,
                blockedDates: property.blockedDates || [],
                calendarRates: property.calendarRates || {},
                calendarMinStays: property.calendarMinStays || {},
                minStay: property.minStay || 1,
                amenities: property.amenities || [],
                fees: property.fees || [],
                taxes: property.taxes || [],
                discounts: property.discounts || { weekly: 0, monthly: 0 },
                suitability: property.suitability || { children: true, pets: false, events: false, smoking: false },
                securityDeposit: property.securityDeposit || { amount: 0, enabled: false },
            }
        });
    } catch (error) {
        handleError(res, error, 'getPropertyById', 400);
    }
};

const getInternalPropertyById = async (propId) => {
    try {
        const property = await prisma.property.findFirst({
            where: {
                OR: [
                    { id: propId },
                    { externalId: propId }
                ]
            },
            include: { shortTermPolicy: true, longTermPolicy: true }
        });
        return property || null;
    } catch (error) {
        console.error('[getInternalPropertyById] DB error:', error.message);
        return null;
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
