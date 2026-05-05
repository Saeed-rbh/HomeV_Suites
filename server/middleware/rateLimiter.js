const rateLimit = require('express-rate-limit');

/**
 * OTP request limiter — max 5 OTP sends per 15 minutes per IP.
 * Applied to /request-email-otp and /create-guest-and-send-otp.
 */
const otpRequestLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many OTP requests. Please try again in 15 minutes.' }
});

/**
 * OTP verification limiter — max 10 attempts per 15 minutes per IP.
 * Applied to /verify-otp to prevent 6-digit code brute force.
 */
const otpVerifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many verification attempts. Please try again in 15 minutes.' }
});

/**
 * General API limiter — 100 requests per minute per IP.
 * Can be applied globally or to specific sensitive routes.
 */
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests. Please slow down.' }
});

module.exports = { otpRequestLimiter, otpVerifyLimiter, apiLimiter };
