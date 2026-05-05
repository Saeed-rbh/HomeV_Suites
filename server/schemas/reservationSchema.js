const { z } = require('zod');

const reservationSchema = z.object({
    propertyId:            z.string().min(1, 'propertyId is required'),
    checkInDate:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkInDate must be YYYY-MM-DD').optional(),
    checkOutDate:          z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkOutDate must be YYYY-MM-DD').optional(),
    startDate:             z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be YYYY-MM-DD').optional(),
    endDate:               z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be YYYY-MM-DD').optional(),
    totalPrice:            z.number().positive('totalPrice must be positive'),
    email:                 z.string().email('Invalid email').optional(),
    name:                  z.string().optional(),
    phone:                 z.string().optional(),
    guestId:               z.string().optional(),
    selectedNonRefundable: z.boolean().optional(),
}).refine(
    (d) => (d.checkInDate || d.startDate) && (d.checkOutDate || d.endDate),
    { message: 'Check-in and check-out dates are required (use checkInDate/checkOutDate or startDate/endDate)' }
);

module.exports = reservationSchema;
