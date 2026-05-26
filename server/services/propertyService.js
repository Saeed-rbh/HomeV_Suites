const prisma = require('../db');

const createProperty = async (data) => {
  return await prisma.property.create({
    data
  });
};

const upsertProperty = async (data) => {
  if (data.lastWebhookTimestamp) {
    const existing = await prisma.property.findUnique({ where: { id: data.id } });
    if (existing && existing.lastWebhookTimestamp && new Date(existing.lastWebhookTimestamp) >= new Date(data.lastWebhookTimestamp)) {
      console.log(`[propertyService] Ignoring stale webhook for property ${data.id}. Existing: ${existing.lastWebhookTimestamp}, Incoming: ${data.lastWebhookTimestamp}`);
      return existing;
    }
  }
  return await prisma.property.upsert({
    where: { id: data.id },
    update: data,
    create: data
  });
};

// Stub — Uplisting access has been removed. Properties must be managed directly in the DB.
const ingestPropertyFromUplisting = async (extId) => {
  console.warn(`[propertyService] ingestPropertyFromUplisting called for ${extId} but Uplisting access is no longer available.`);
  return await prisma.property.findFirst({ where: { OR: [{ id: extId }, { externalId: extId }] } });
};

const parseJson = (raw, fallback) => {
  if (!raw) return fallback;
  if (typeof raw !== 'string') return raw;
  try { return JSON.parse(raw); } catch { return fallback; }
};

const getProperties = async (filters = {}) => {
  const props = await prisma.property.findMany({
    where: { isActive: { not: false }, ...filters },
    include: {
      manager: {
        select: { id: true, email: true }
      }
    }
  });
  return props.map(p => {
    const images = parseJson(p.images, []);
    return {
      ...p,
      images: Array.isArray(images) ? images : [],
      thumbnailUrl: p.thumbnailUrl || (Array.isArray(images) ? images[0] : null) || null,
      bookingUrl: p.bookingUrl || `https://book.homevsuites.com/listings/${p.id}`,
      rating: p.rating || null,
      reviewCount: p.reviewCount || null,
      amenities:          parseJson(p.amenities, []),
      fees:               parseJson(p.fees, []),
      taxes:              parseJson(p.taxes, []),
      suitability:        parseJson(p.suitability, { children: true, pets: false, events: false, smoking: false }),
      discounts:          parseJson(p.discounts, { weekly: 0, monthly: 0 }),
      securityDeposit:    parseJson(p.securityDeposit, { amount: 0, enabled: false }),
      bedTypes:           parseJson(p.bedTypes, []),
      channelCommissions: parseJson(p.channelCommissions, []),
      blockedDates:       parseJson(p.blockedDates, []),
      calendarRates:      parseJson(p.calendarRates, {}),
      calendarMinStays:   parseJson(p.calendarMinStays, {}),
    };
  });
};



const getPropertyById = async (id) => {
  return await prisma.property.findUnique({
    where: { id },
    include: {
      manager: {
        select: { id: true, email: true }
      }
    }
  });
};

const updateProperty = async (id, data) => {
  return await prisma.property.update({
    where: { id },
    data
  });
};

const deleteProperty = async (id) => {
  return await prisma.property.delete({
    where: { id }
  });
};

module.exports = {
  createProperty,
  upsertProperty,
  ingestPropertyFromUplisting,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty
};
