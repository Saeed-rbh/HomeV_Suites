const prisma = require('../db');

const { fetchPropertyData } = require('./uplistingService');

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

const ingestPropertyFromUplisting = async (extId) => {
  let title = 'Property ' + extId;
  let address = '';
  let images = null;
  let thumbnailUrl = null;
  let description = null;
  let pricePerNight = 200.0;
  let capacity = 4;
  let bedrooms = 2;
  let nickname = null;

  try {
    const response = await fetchPropertyData(extId, `/properties/${extId}?include=photos,addresses`);
    const item = response.data?.data || response.data;
    const attr = item?.attributes || {};
    const included = response.data?.included || [];

    const addressMap = {};
    const photoMap = {};
    for (const inc of included) {
      if (inc.type === 'addresses') addressMap[inc.id] = inc.attributes;
      else if (inc.type === 'photos') photoMap[inc.id] = inc.attributes.url;
    }

    title = attr.name || attr.nickname || title;
    nickname = attr.nickname || null;
    const addrId = item?.relationships?.address?.data?.id;
    const addrData = addrId ? addressMap[addrId] : null;
    address = addrData
      ? `${addrData.street || ''}, ${addrData.city || ''}, ${addrData.state || ''}, ${addrData.country || ''}`
      : 'Address on file';
    description = attr.description || null;

    const photoRefs = item?.relationships?.photos?.data || [];
    const pics = photoRefs.map(p => photoMap[p.id]).filter(Boolean);
    images = pics.length > 0 ? JSON.stringify(pics) : null;
    thumbnailUrl = pics[0] || null;
    pricePerNight = attr.default_daily_rate ? parseFloat(attr.default_daily_rate) : pricePerNight;
    capacity = attr.maximum_capacity ? parseInt(attr.maximum_capacity) : capacity;
    bedrooms = attr.bedrooms ? parseInt(attr.bedrooms) : bedrooms;
  } catch (e) {
    console.error('[ERROR] Could not fetch from Uplisting:', e.message);
  }

  const result = await prisma.property.upsert({
    where: { id: extId },
    update: { externalId: extId, title, nickname, address, description, images, thumbnailUrl, pricePerNight, capacity, bedrooms },
    create: { id: extId, externalId: extId, title, nickname, address, description, images, thumbnailUrl, pricePerNight, capacity, bedrooms }
  });

  console.log(`[DONE] Ingested Property ${extId}: title="${title}"`);
  return result;
};

const getProperties = async (filters = {}) => {
  return await prisma.property.findMany({
    where: filters,
    include: {
      manager: {
        select: { id: true, email: true }
      }
    }
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
