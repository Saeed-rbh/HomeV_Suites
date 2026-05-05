const { z } = require('zod');

const requestOtpSchema = z.object({
    email: z.string().email('A valid email is required')
});

const verifyOtpSchema = z.object({
    identifier: z.string().min(1, 'identifier is required'),
    otp:        z.string().length(6, 'OTP must be 6 digits').optional(),
    idToken:    z.string().optional(),
}).refine(
    (d) => d.otp || d.idToken,
    { message: 'Either otp or idToken must be provided' }
);

const createGuestOtpSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName:  z.string().optional(),
    email:     z.string().email('A valid email is required'),
    phone:     z.string().optional(),
});

module.exports = { requestOtpSchema, verifyOtpSchema, createGuestOtpSchema };
