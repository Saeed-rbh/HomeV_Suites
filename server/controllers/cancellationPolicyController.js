const prisma = require('../db');

exports.getAllPolicies = async (req, res) => {
  try {
    const policies = await prisma.cancellationPolicy.findMany({
      orderBy: { createdAt: 'asc' }
    });
    
    // Best-effort check to find the active policy (assuming it's applied to all)
    const firstProperty = await prisma.property.findFirst({
      select: { shortTermPolicyId: true, longTermPolicyId: true }
    });
    const activeShortTermPolicyId = firstProperty?.shortTermPolicyId || null;
    const activeLongTermPolicyId = firstProperty?.longTermPolicyId || null;

    res.status(200).json({ success: true, data: policies, activeShortTermPolicyId, activeLongTermPolicyId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getPolicyById = async (req, res) => {
  try {
    const policy = await prisma.cancellationPolicy.findUnique({
      where: { id: req.params.id }
    });
    if (!policy) return res.status(404).json({ success: false, error: 'Policy not found' });
    res.status(200).json({ success: true, data: policy });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createPolicy = async (req, res) => {
  try {
    const { 
      name, type, fullRefundDaysPrior, partialRefundDaysPrior, partialRefundPercentage, 
      bookingGracePeriodHours, offerNonRefundableDiscount, nonRefundableDiscountPercentage 
    } = req.body;

    const policy = await prisma.cancellationPolicy.create({
      data: {
        name,
        type: type || 'SHORT_TERM',
        fullRefundDaysPrior,
        partialRefundDaysPrior,
        partialRefundPercentage,
        bookingGracePeriodHours,
        offerNonRefundableDiscount,
        nonRefundableDiscountPercentage
      }
    });
    res.status(201).json({ success: true, data: policy });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updatePolicy = async (req, res) => {
  try {
    const { 
      name, type, fullRefundDaysPrior, partialRefundDaysPrior, partialRefundPercentage, 
      bookingGracePeriodHours, offerNonRefundableDiscount, nonRefundableDiscountPercentage 
    } = req.body;
    
    // Make sure we extract id from params
    const policy = await prisma.cancellationPolicy.update({
      where: { id: req.params.id },
      data: {
        name,
        type: type || 'SHORT_TERM',
        fullRefundDaysPrior,
        partialRefundDaysPrior,
        partialRefundPercentage,
        bookingGracePeriodHours,
        offerNonRefundableDiscount,
        nonRefundableDiscountPercentage
      }
    });
    res.status(200).json({ success: true, data: policy });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deletePolicy = async (req, res) => {
  try {
    await prisma.cancellationPolicy.delete({
      where: { id: req.params.id }
    });
    res.status(200).json({ success: true, message: 'Policy deleted' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.processCancellation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        property: {
          include: { shortTermPolicy: true, longTermPolicy: true }
        }
      }
    });

    if (!reservation) return res.status(404).json({ success: false, error: 'Reservation not found' });

    const now = new Date();
    const checkIn = new Date(reservation.startDate);
    const checkOut = new Date(reservation.endDate);
    const nights = Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    
    const policy = nights >= 28 ? reservation.property.longTermPolicy : reservation.property.shortTermPolicy;
    if (!policy) return res.status(400).json({ success: false, error: 'No cancellation policy defined for this property' });
    
    // Calculate the difference in hours
    const hoursSinceBooking = (now - new Date(reservation.createdAt)) / (1000 * 60 * 60);

    let refundStatus = 'NO_REFUND';
    let refundAmount = 0;

    // Apply grace period check -> full refund
    if (hoursSinceBooking <= policy.bookingGracePeriodHours) {
      refundStatus = 'FULL_REFUND_GRACE_PERIOD';
      refundAmount = reservation.totalPrice;
    } else if (reservation.selectedNonRefundable) {
      // Check selectedNonRefundable -> no refund (outside grace period)
      refundStatus = 'NO_REFUND_NON_REFUNDABLE_SELECTED';
      refundAmount = 0;
    } else {
      const daysUntilCheckIn = (checkIn - now) / (1000 * 60 * 60 * 24);

      if (daysUntilCheckIn >= policy.fullRefundDaysPrior) {
        refundStatus = 'FULL_REFUND';
        refundAmount = reservation.totalPrice;
      } else if (daysUntilCheckIn >= policy.partialRefundDaysPrior) {
        refundStatus = 'PARTIAL_REFUND';
        refundAmount = reservation.totalPrice * (policy.partialRefundPercentage / 100);
      }
    }

    res.status(200).json({ 
      success: true, 
      data: {
        refundStatus,
        refundAmount,
        totalPrice: reservation.totalPrice
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.applyPolicyToAllListings = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'SHORT_TERM' or 'LONG_TERM'
    
    if (type === 'LONG_TERM') {
      const properties = await prisma.property.findMany({ select: { id: true } });
      await Promise.all(properties.map(p => 
        prisma.property.update({ where: { id: p.id }, data: { longTermPolicyId: id } })
      ));
    } else {
      const properties = await prisma.property.findMany({ select: { id: true } });
      await Promise.all(properties.map(p => 
        prisma.property.update({ where: { id: p.id }, data: { shortTermPolicyId: id } })
      ));
    }

    res.status(200).json({ success: true, message: `Policy applied to all listings for ${type === 'LONG_TERM' ? 'long' : 'short'} term stays` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
