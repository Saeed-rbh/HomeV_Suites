const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { protect: auth } = require('../middleware/auth');
const prisma = require('../db');
const admin = require('../config/firebaseAdmin');
const { normalizePhone } = require('../utils/phoneUtils');
const { sendOtpEmail } = require('../services/mailService');
const { sendOtpSms } = require('../services/smsService');
const validate = require('../middleware/validate');
const { requestOtpSchema, verifyOtpSchema, createGuestOtpSchema } = require('../schemas/authSchema');
const { otpRequestLimiter, otpVerifyLimiter, apiLimiter } = require('../middleware/rateLimiter');

// @route   POST api/auth/check-user
// @desc    Check if an email or phone belongs to an existing user/guest
router.post('/check-user', apiLimiter, async (req, res) => {
    const { identifier } = req.body;
    if (!identifier) return res.status(400).json({ msg: 'Identifier required' });
    const normalizedPhone = normalizePhone(identifier);
    const digits = identifier.replace(/\D/g, '');
    const shortPhone = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : (digits.length === 10 ? digits : null);

    try {
        const user = await prisma.user.findFirst({
            where: { OR: [{ email: identifier }, { phone: normalizedPhone }, ...(shortPhone ? [{ phone: shortPhone }] : []), { phone: identifier }] }
        });
        if (user) return res.json({ exists: true });

        const guest = await prisma.guestProfile.findFirst({
            where: { OR: [{ email: identifier }, { phone: normalizedPhone }, ...(shortPhone ? [{ phone: shortPhone }] : []), { phone: identifier }] }
        });
        res.json({ exists: !!guest });
    } catch (err) {
        console.error('Check User Error:', err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// @route   POST api/auth/create-guest-and-send-otp
// @desc    Register a brand-new guest and immediately send them an OTP
router.post('/create-guest-and-send-otp', otpRequestLimiter, async (req, res) => {
    const { firstName, lastName, email, phone, loginMethod } = req.body;
    if (!firstName || !email) return res.status(400).json({ msg: 'Name and email are required' });

    try {
        const normalizedP = normalizePhone(phone);
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        // Hash OTP before storing — never persist plaintext OTPs
        const otpHash = await bcrypt.hash(otpCode, 10);
        const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

        // Check if already exists by email or phone (prevent double-registrations)
        let existing = await prisma.guestProfile.findFirst({
            where: { OR: [{ email }, ...(normalizedP ? [{ phone: normalizedP }] : [])] }
        });

        if (existing) {
            await prisma.guestProfile.update({ where: { id: existing.id }, data: { otpCode: otpHash, otpExpiresAt } });
        } else {
            await prisma.guestProfile.create({
                data: { firstName, lastName: lastName || '', email, phone: normalizedP || null, otpCode: otpHash, otpExpiresAt }
            });
        }

        if (loginMethod === 'phone' && normalizedP) {
            await sendOtpSms(normalizedP, otpCode);
            res.json({ msg: 'Account created and SMS OTP sent', phone: normalizedP });
        } else {
            await sendOtpEmail(email, otpCode);
            res.json({ msg: 'Account created and OTP sent', email });
        }
    } catch (err) {
        console.error('Create Guest Error:', err.message);
        res.status(500).json({ error: 'Server Error: ' + err.message });
    }
});

// @route   POST api/auth/request-phone-otp
// @desc    Generate and SMS a 6-digit OTP
router.post('/request-phone-otp', otpRequestLimiter, async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ msg: 'Phone number is required' });

    try {
        const normalizedP = normalizePhone(phone);
        if (!normalizedP) return res.status(400).json({ msg: 'Invalid phone number format' });

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otpCode, 10);
        const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        let user = await prisma.user.findUnique({ where: { phone: normalizedP } });
        let guest = null;

        if (!user) {
            guest = await prisma.guestProfile.findUnique({ where: { phone: normalizedP } });
        }

        if (user) {
            await prisma.user.update({ where: { id: user.id }, data: { otpCode: otpHash, otpExpiresAt } });
        } else if (guest) {
            await prisma.guestProfile.update({ where: { id: guest.id }, data: { otpCode: otpHash, otpExpiresAt } });
        } else {
            // Create a new guest if it's their first time
            const placeholderEmail = `${normalizedP.replace(/\D/g, '')}@placeholder.com`;
            await prisma.guestProfile.create({
                data: { phone: normalizedP, email: placeholderEmail, firstName: 'Guest', lastName: 'User', otpCode: otpHash, otpExpiresAt }
            });
        }

        await sendOtpSms(normalizedP, otpCode);
        res.json({ msg: 'OTP sent successfully' });
    } catch (err) {
        console.error('Request Phone OTP Error:', err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/request-email-otp
// @desc    Generate and email a 6-digit OTP
router.post('/request-email-otp', otpRequestLimiter, validate(requestOtpSchema), async (req, res) => {
    const { email } = req.body;

    try {
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        // Hash OTP before storing — never persist plaintext OTPs
        const otpHash = await bcrypt.hash(otpCode, 10);
        const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        let user = await prisma.user.findUnique({ where: { email } });
        let guest = null;

        if (!user) {
            guest = await prisma.guestProfile.findUnique({ where: { email } });
        }

        if (user) {
            await prisma.user.update({ where: { email }, data: { otpCode: otpHash, otpExpiresAt } });
        } else if (guest) {
            await prisma.guestProfile.update({ where: { email }, data: { otpCode: otpHash, otpExpiresAt } });
        } else {
            // Create a new guest if it's their first time
            await prisma.guestProfile.create({
                data: { email, firstName: 'Guest', lastName: 'User', otpCode: otpHash, otpExpiresAt }
            });
        }

        await sendOtpEmail(email, otpCode);
        res.json({ msg: 'OTP sent successfully' });
    } catch (err) {
        console.error('Request Email OTP Error:', err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/verify-otp
// @desc    Verify Firebase Token or Custom Email OTP and create local session
router.post('/verify-otp', otpVerifyLimiter, async (req, res) => {
    const { idToken, identifier, otp } = req.body;
    
    try {
        let lookup;
        let decodedToken = null;
        let isEmailOTP = false;
        const sanitizedOtp = otp ? otp.replace(/\D/g, "") : "";

        if (idToken) {
            // Firebase authentication path (Phones)
            decodedToken = await admin.auth().verifyIdToken(idToken);
            lookup = identifier || decodedToken.phone_number || decodedToken.email;
        } else if (otp && identifier) {
            // Custom Email Authentication path
            lookup = identifier;
            isEmailOTP = true;
        } else {
            return res.status(400).json({ msg: 'Authentication tokens missing' });
        }

        // UNIVERSAL NORMALIZATION
        const normalizedLookup = normalizePhone(lookup);
        const isLookupEmail = lookup && lookup.includes('@');
        const digits = lookup.replace(/\D/g, '');
        const shortPhone = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : (digits.length === 10 ? digits : null);

        // Sync with local database
        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: lookup },
                    { phone: normalizedLookup },
                    ...(shortPhone ? [{ phone: shortPhone }] : []),
                    { phone: lookup } 
                ]
            }
        });

        let guest = null;
        if (!user) {
            guest = await prisma.guestProfile.findFirst({
                where: {
                    OR: [
                        { email: lookup },
                        { phone: normalizedLookup },
                        ...(shortPhone ? [{ phone: shortPhone }] : []),
                        { phone: lookup }
                    ]
                }
            });
        }

        // Verify Custom OTP — compare against bcrypt hash
        if (isEmailOTP) {
            const target = user || guest;
            if (!target) return res.status(400).json({ msg: 'User not found' });
            // Use bcrypt.compare to verify against hashed OTP
            const isValid = await bcrypt.compare(sanitizedOtp, target.otpCode || '');
            if (!isValid) return res.status(400).json({ msg: 'Invalid verification code' });
            if (new Date() > new Date(target.otpExpiresAt)) return res.status(400).json({ msg: 'Verification code has expired' });

            // Clear OTP after successful verification
            if (user) {
                await prisma.user.update({ where: { id: user.id }, data: { otpCode: null, otpExpiresAt: null } });
            } else {
                await prisma.guestProfile.update({ where: { id: guest.id }, data: { otpCode: null, otpExpiresAt: null } });
            }
        }
        
        // Ensure guest is dynamically provisioned if they exist in Firebase but not in local DB yet
        if (!user && !guest && idToken) {
           const mappedEmail = isLookupEmail ? normalizedLookup : `${normalizedLookup}@placeholder.com`;
           
           guest = await prisma.guestProfile.findUnique({ where: { email: mappedEmail } });
           
           if (!guest) {
               guest = await prisma.guestProfile.create({
                    data: {
                        email: mappedEmail,
                        phone: !isLookupEmail ? normalizedLookup : null,
                        firstName: decodedToken?.name?.split(' ')[0] || 'Guest',
                        lastName: decodedToken?.name?.split(' ')[1] || 'User'
                    }
                });
           }
        }

        const targetAccount = user || guest;
        const role = user ? user.role : 'GUEST';

        // Create our own JWT session
        const payload = { user: { id: targetAccount.id, role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: user ? targetAccount : null, guest: guest ? targetAccount : null, role });
        });
    } catch (err) {
        console.error('Verify Error:', err.message);
        res.status(401).json({ msg: 'Unauthorized: Invalid Token or Code' });
    }
});

// @route   GET api/auth/user
// @desc    Get logged in user (lightweight)
// @access  Private
router.get('/user', auth, async (req, res) => {
    try {
        res.json({ id: req.user.id, role: req.user.role });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/auth/me
// @desc    Get current authenticated user/guest profile
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        const { id, role } = req.user;

        if (role === 'GUEST') {
            const guest = await prisma.guestProfile.findUnique({
                where: { id },
                select: { id: true, firstName: true, lastName: true, email: true, phone: true }
            });
            return res.json({ role: 'GUEST', profile: guest });
        }

        const user = await prisma.user.findUnique({
            where: { id },
            select: { id: true, email: true, phone: true, role: true }
        });
        res.json({ role: user?.role || 'ADMIN', profile: user });
    } catch (err) {
        console.error('Me Error:', err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;
