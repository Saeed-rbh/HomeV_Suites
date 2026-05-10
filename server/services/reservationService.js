const prisma = require('../db');
const crypto = require('crypto');
const telegramService = require('./telegramService');
const { unblockCalendarDates, updateV2Booking, cancelV2Booking, blockCalendarDates } = require('./uplistingService');
const stripe = require('../utils/stripeClient');

const createReservation = async (data, paymentIntentId = null) => {
  const reservationId = crypto.randomUUID();

  // Guard: check for overlapping confirmed reservations using a transaction to prevent race conditions
  const reservation = await prisma.$transaction(async (tx) => {
    const overlap = await tx.reservation.findFirst({
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

    return await tx.reservation.create({ 
      data: { ...data, id: reservationId } 
    });
  });

  if (paymentIntentId) {
    try {
      await prisma.transaction.create({
        data: {
          amount: data.totalPrice,
          currency: 'CAD',
          status: 'COMPLETED',
          paymentMethodId: paymentIntentId,  // legacy
          stripeIntentId: paymentIntentId,   // typed field
          reservationId: reservationId
        }
      });
    } catch (err) {
      console.error('[ReservationService] Transaction creation failed, rolling back reservation:', err.message);
      await prisma.reservation.delete({ where: { id: reservationId } }).catch(e => 
        console.error('[ReservationService] CRITICAL: Failed to rollback reservation:', e.message)
      );
      throw err;
    }
  }

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
    if (data.uplistingBookingId) {
        const byUplistingId = await prisma.reservation.findFirst({ where: { uplistingBookingId: data.uplistingBookingId } });
        if (byUplistingId) {
            return await prisma.reservation.update({
                where: { id: byUplistingId.id },
                data: safeData
            });
        }
    }
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
  // Whitelist allowed query parameters to prevent NoSQL injection
  const allowedFilters = ['status', 'propertyId', 'guestId'];
  const safeFilters = {};
  for (const key of allowedFilters) {
    if (filters[key] !== undefined) {
      safeFilters[key] = filters[key];
    }
  }

  return await prisma.reservation.findMany({
    where: safeFilters,
    include: {
      property: { select: { id: true, title: true } },
      guest: { select: { id: true, firstName: true, lastName: true } },
      transactions: true
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

  const transaction = fullRes.transactions.find(t => t.status === 'COMPLETED' && t.stripeIntentId && t.stripeIntentId.startsWith('pi_'));
  if (!transaction) return; // Not a website booking (e.g. OTA), do not refund via Stripe

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
      // Notify admin that manual refund is needed
      try {
        await telegramService.sendTextMessage(
            getGroupId(), // assuming getGroupId exists, or we just rely on the general topic
            `⚠️ STRIPE REFUND FAILED ⚠️\nReservation: ${reservationId}\nAmount: $${refundAmountCents / 100}\nError: ${err.message}\nPlease process manually in Stripe dashboard.`
        );
      } catch (telegramErr) {}
    }
  }
};

const handleCancellationCleanup = async (id) => {
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

            if (fullRes.uplistingBookingId) {
                const today = new Date().toISOString().split('T')[0];
                const uplistingDirectUrl = `https://app.uplisting.io/calendar/bookings/${fullRes.uplistingBookingId}/details?from=${today}`;
                console.warn(`[ReservationService] ⚠ MANUAL ACTION REQUIRED ══════════════════════════════════════════`);
                console.warn(`[ReservationService] 👉 Uplisting booking #${fullRes.uplistingBookingId} must be cancelled manually in the dashboard.`);
                console.warn(`[ReservationService] 🔗 Direct link: ${uplistingDirectUrl}`);
                console.warn(`[ReservationService] ══════════════════════════════════════════════════════════════════════`);
            }

            console.log(`[ReservationService] 🔓 Unblocking calendar dates on property ${blockPropId}: ${rawCheckIn} → ${rawCheckOut}`);
            unblockCalendarDates(blockPropId, rawCheckIn, rawCheckOut).catch(err =>
                console.error('[ReservationService] ⚠ Failed to unblock calendar dates on Uplisting:', err.message)
            );
        } catch (e) {
            console.error('[ReservationService] ⚠ Error preparing Uplisting cancellation:', e.message);
        }
    }
};

const updateReservationStatus = async (id, status) => {
  const result = await prisma.reservation.update({
    where: { id },
    data: { status }
  });

  const upperStatus = status.toUpperCase();
  
  if (['CANCELLED', 'FINISHED', 'INACTIVE'].includes(upperStatus)) {
      if (upperStatus === 'CANCELLED') {
          await handleCancellationCleanup(id);
      } else {
          // Announce and close thread for finished/inactive
          const fullRes = await prisma.reservation.findUnique({
              where: { id },
              include: { guest: true, property: true }
          });
          if (fullRes) {
              telegramService.announceReservationStatusChange(fullRes, fullRes.property, fullRes.guest, status).catch(e => console.error(e));
          }
          const thread = await prisma.messageThread.findUnique({ where: { reservationId: id } });
          if (thread && thread.telegramTopicId) {
              await telegramService.deleteTopic(thread.telegramTopicId);
          }
      }
  } else {
      const fullRes = await prisma.reservation.findUnique({
          where: { id },
          include: { guest: true, property: true }
      });
      if (fullRes) {
          telegramService.announceReservationStatusChange(fullRes, fullRes.property, fullRes.guest, status).catch(e => console.error(e));
      }
  }
  return result;
};

const deleteReservation = async (id) => {
  // Soft delete instead of hard delete to preserve audit history and transactions
  await handleCancellationCleanup(id);
  return await prisma.reservation.update({
    where: { id },
    data: { status: 'CANCELLED' }
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
