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

const parseImages = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [];
};

const getProperties = async (filters = {}) => {
  const props = await prisma.property.findMany({
    where: filters,
    include: {
      manager: {
        select: { id: true, email: true }
      }
    }
  });
  return props.map(p => ({
    ...p,
    images: parseImages(p.images),
    thumbnailUrl: p.thumbnailUrl || parseImages(p.images)[0] || null
  }));
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
