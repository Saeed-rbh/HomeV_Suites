const prisma = require('../db');
const telegramService = require('./telegramService');
const { unblockCalendarDates, updateV2Booking } = require('./uplistingService');
const stripe = require('../utils/stripeClient');

const createReservation = async (data, paymentIntentId = null) => {
  // Guard: check for overlapping confirmed reservations on the same property
  const overlap = await prisma.reservation.findFirst({
    where: {
      propertyId: data.propertyId,
      status: { notIn: ['CANCELLED'] },
      AND: [
        { startDate: { lt: new Date(data.endDate) } },
        { endDate:   { gt: new Date(data.startDate) } }
      ]
    }
  });
  if (overlap) throw new Error('Property is not available for the selected dates.');

  const reservation = await prisma.$transaction(async (tx) => {
    const res = await tx.reservation.create({ data });
    
    if (paymentIntentId) {
      await tx.transaction.create({
        data: {
          amount: res.totalPrice,
          currency: 'CAD',
          status: 'COMPLETED',
          paymentMethodId: paymentIntentId,  // legacy
          stripeIntentId: paymentIntentId,   // typed field
          reservationId: res.id
        }
      });
    }
    
    return res;
  });

  return reservation;
};

const upsertReservation = async (data) => {
  if (data.externalId && data.lastWebhookTimestamp) {
    const existing = await prisma.reservation.findUnique({ where: { externalId: data.externalId } });
    if (existing && existing.lastWebhookTimestamp && new Date(existing.lastWebhookTimestamp) >= new Date(data.lastWebhookTimestamp)) {
      console.log(`[reservationService] Ignoring stale webhook for booking ${data.externalId}. Existing: ${existing.lastWebhookTimestamp}, Incoming: ${data.lastWebhookTimestamp}`);
      return existing;
    }
  }

  // Whitelist fields to avoid Prisma errors from unexpected webhook payload keys
  const safeData = {
    externalId: data.externalId,
    uplistingBookingId: data.uplistingBookingId,
    startDate: data.startDate,
    endDate: data.endDate,
    status: data.status,
    totalPrice: data.totalPrice,
    selectedNonRefundable: data.selectedNonRefundable,
    propertyId: data.propertyId,
    guestId: data.guestId,
    lastWebhookTimestamp: data.lastWebhookTimestamp
  };
  // Remove undefined keys so they don't overwrite existing db data
  Object.keys(safeData).forEach(key => safeData[key] === undefined && delete safeData[key]);

  if (data.externalId) {
    return await prisma.reservation.upsert({
      where: { externalId: data.externalId },
      update: safeData,
      create: safeData
    });
  } else {
    return await prisma.reservation.create({ data: safeData });
  }
};

const getReservations = async (filters = {}) => {
  return await prisma.reservation.findMany({
    where: filters,
    include: {
      property: { select: { id: true, title: true } },
      guest: { select: { id: true, firstName: true, lastName: true } }
    }
  });
};

const getReservationById = async (id) => {
  return await prisma.reservation.findUnique({
    where: { id },
    include: {
      property: true,
      guest: true
    }
  });
};

const processRefundIfApplicable = async (reservationId) => {
  const fullRes = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      property: {
        include: { shortTermPolicy: true, longTermPolicy: true }
      },
      transactions: true
    }
  });

  if (!fullRes || fullRes.selectedNonRefundable) return;

  const transaction = fullRes.transactions.find(t => t.status === 'COMPLETED' && t.paymentMethodId && t.paymentMethodId.startsWith('pi_'));
  if (!transaction) return;

  const nights = Math.round((new Date(fullRes.endDate) - new Date(fullRes.startDate)) / (1000 * 60 * 60 * 24));
  const policy = (nights >= 28 && fullRes.property.longTermPolicy) 
    ? fullRes.property.longTermPolicy 
    : fullRes.property.shortTermPolicy;
    
  if (!policy) return;

  const daysUntilCheckIn = Math.round((new Date(fullRes.startDate) - new Date()) / (1000 * 60 * 60 * 24));
  
  let refundPercentage = 0;
  if (daysUntilCheckIn >= policy.fullRefundDaysPrior) {
    refundPercentage = 100;
  } else if (daysUntilCheckIn >= policy.partialRefundDaysPrior) {
    refundPercentage = policy.partialRefundPercentage;
  }

  if (refundPercentage > 0) {
    const refundAmountCents = Math.round((transaction.amount * (refundPercentage / 100)) * 100);
    try {
      const refund = await stripe.refunds.create({
        payment_intent: transaction.paymentMethodId,
        amount: refundAmountCents,
      });
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'REFUNDED',
          stripeRefundId: refund.id  // persist refund ID for audit trail
        }
      });
      console.log(`[Stripe] Refunded $${refundAmountCents / 100} for reservation ${reservationId} — refund ID: ${refund.id}`);
    } catch (err) {
      console.error('[Stripe] Refund failed:', err.message);
    }
  }
};

const updateReservationStatus = async (id, status) => {
  const result = await prisma.reservation.update({
    where: { id },
    data: { status }
  });

  const upperStatus = status.toUpperCase();
  
  // Announce modification to Telegram General Topic
  const fullRes = await prisma.reservation.findUnique({
      where: { id },
      include: { guest: true, property: true }
  });
  if (fullRes) {
      telegramService.announceReservationStatusChange(fullRes, fullRes.property, fullRes.guest, status).catch(e => console.error(e));
  }

  if (['CANCELLED', 'FINISHED', 'INACTIVE'].includes(upperStatus)) {
      const thread = await prisma.messageThread.findUnique({ where: { reservationId: id } });
      if (thread && thread.telegramTopicId) {
          await telegramService.deleteTopic(thread.telegramTopicId);
      }
      
      if (upperStatus === 'CANCELLED' && fullRes && fullRes.property) {
          await processRefundIfApplicable(id);
          try {
              const rawCheckIn = fullRes.startDate.toISOString().split('T')[0];
              const rawCheckOut = fullRes.endDate.toISOString().split('T')[0];
              const blockPropId = fullRes.property.externalId || fullRes.property.id;
              unblockCalendarDates(blockPropId, rawCheckIn, rawCheckOut).catch(err => 
                  console.error('[ReservationService] ⚠ Failed to unblock dates on Uplisting:', err.message)
              );
          } catch (e) {
              console.error('[ReservationService] ⚠ Error preparing Uplisting unblock:', e.message);
          }
      }
  }
  return result;
};

const deleteReservation = async (id) => {
  // Announce the deletion
  const fullRes = await prisma.reservation.findUnique({
      where: { id },
      include: { guest: true, property: true }
  });
  if (fullRes) {
      telegramService.announceReservationStatusChange(fullRes, fullRes.property, fullRes.guest, 'CANCELLED').catch(e => console.error(e));
  }

  const thread = await prisma.messageThread.findUnique({ where: { reservationId: id } });
  if (thread && thread.telegramTopicId) {
      await telegramService.deleteTopic(thread.telegramTopicId);
  }

  if (fullRes && fullRes.property) {
      await processRefundIfApplicable(id);
      try {
          const rawCheckIn = fullRes.startDate.toISOString().split('T')[0];
          const rawCheckOut = fullRes.endDate.toISOString().split('T')[0];
          const blockPropId = fullRes.property.externalId || fullRes.property.id;
          unblockCalendarDates(blockPropId, rawCheckIn, rawCheckOut).catch(err => 
              console.error('[ReservationService] ⚠ Failed to unblock dates on Uplisting:', err.message)
          );
      } catch (e) {
          console.error('[ReservationService] ⚠ Error preparing Uplisting unblock:', e.message);
      }
  }

  return await prisma.reservation.delete({
    where: { id }
  });
};

module.exports = {
  createReservation,
  upsertReservation,
  getReservations,
  getReservationById,
  updateReservationStatus,
  deleteReservation
};
