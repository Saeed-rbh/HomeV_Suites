/**
 * Find reservation with uplistingBookingId=10784592 in local DB,
 * then force-unblock those calendar dates via the V1 Uplisting API.
 * Run: node fix_booking_10784592.js
 */
require('dotenv').config();
const axios = require('axios');
const prisma = require('./db');

const API_KEY = process.env.UPLISTING_API_KEY;

const apiClient = axios.create({
  baseURL: 'https://connect.uplisting.io',
  headers: {
    'Authorization': `Basic ${Buffer.from(API_KEY).toString('base64')}`,
    'Content-Type': 'application/json'
  }
});

(async () => {
  // 1. Find the local reservation by uplistingBookingId
  console.log('\n=== Looking up reservation in local DB ===');
  const reservation = await prisma.reservation.findFirst({
    where: { uplistingBookingId: '10784592' },
    include: { property: true }
  });

  if (!reservation) {
    console.error('❌ No reservation found with uplistingBookingId=10784592');
    console.log('Trying by recent creation (May 8 2026)...');
    
    const recent = await prisma.reservation.findMany({
      where: {
        createdAt: { gte: new Date('2026-05-08T00:00:00Z') },
        status: 'CANCELLED'
      },
      include: { property: true },
      orderBy: { createdAt: 'desc' }
    });
    console.log('Recent cancelled reservations today:', JSON.stringify(recent.map(r => ({
      id: r.id,
      uplistingBookingId: r.uplistingBookingId,
      startDate: r.startDate,
      endDate: r.endDate,
      status: r.status,
      propertyId: r.propertyId,
      propertyExternalId: r.property?.externalId
    })), null, 2));
    await prisma.$disconnect();
    return;
  }

  const propExternalId = reservation.property?.externalId || reservation.propertyId;
  const startDate = reservation.startDate.toISOString().split('T')[0];
  const endDate   = reservation.endDate.toISOString().split('T')[0];

  console.log(`✅ Found reservation: ${reservation.id}`);
  console.log(`   Status:     ${reservation.status}`);
  console.log(`   Property:   ${propExternalId}`);
  console.log(`   Dates:      ${startDate} → ${endDate}`);
  console.log(`   uplistingBookingId: ${reservation.uplistingBookingId}`);

  // 2. Build date list to unblock (checkIn inclusive, checkOut exclusive)
  console.log('\n=== Unblocking dates via V1 calendar API ===');
  const days = [];
  const d = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');
  while (d < end) {
    days.push({ date: d.toISOString().slice(0, 10), available: true, note: '' });
    d.setUTCDate(d.getUTCDate() + 1);
  }

  console.log(`Unblocking ${days.length} night(s) on property ${propExternalId}:`, days.map(x => x.date).join(', '));

  try {
    const res = await apiClient.post(`/calendar/${propExternalId}`, {
      calendar: { days }
    });
    console.log(`\n✅ Calendar unblocked — HTTP ${res.status}`);
  } catch (err) {
    console.error('\n❌ Calendar unblock failed:', err.response?.status, JSON.stringify(err.response?.data || err.message, null, 2));
  }

  await prisma.$disconnect();
})();
