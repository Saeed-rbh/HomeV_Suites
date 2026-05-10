const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { protect: auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const { normalizePhone } = require('../utils/phoneUtils');

// Multer config for staff avatar uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads', 'avatars')),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `staff-${Date.now()}${ext}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
        cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
    }
});

// Middleware to strictly enforce that the requester is an ADMIN
const requireAdmin = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return res.status(403).json({ msg: 'Access denied: Requires Admin privileges' });
        }
        next();
    } catch (err) {
        console.error('Role middleware error:', err);
        res.status(500).send('Server Error');
    }
};

// @route   GET api/admin/staff
// @desc    Get all staff members authorized as ADMIN
router.get('/staff', auth, requireAdmin, async (req, res) => {
    try {
        const staff = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: {
                id: true,
                email: true,
                phone: true,
                displayName: true,
                avatarUrl: true,
                isHost: true,
                createdAt: true,
            }
        });
        res.json(staff);
    } catch (err) {
        console.error('Get Staff Error:', err.message);
        res.status(500).json({ error: 'Server Error: ' + err.message });
    }
});



// @route   POST api/admin/staff
// @desc    Add a new staff member
router.post('/staff', auth, requireAdmin, async (req, res) => {
    const { email, phone, firstName, lastName } = req.body;
    
    if (!email && !phone) {
        return res.status(400).json({ msg: 'Must provide either email or phone number' });
    }

    const normalizedPhone = normalizePhone(phone);

    try {
        // Attempt to find existing user first
        let existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    ...(email ? [{ email }] : []),
                    ...(normalizedPhone ? [{ phone: normalizedPhone }] : [])
                ]
            }
        });

        if (existingUser) {
            // Upgrade role if existing user found
            await prisma.user.update({
                where: { id: existingUser.id },
                data: { role: 'ADMIN' }
            });
            return res.json({ msg: 'Existing user was upgraded to ADMIN.' });
        }

        // Validate generated email if they only passed a phone number
        const newEmail = email || `${phone.replace(/\D/g, '')}@placeholder.com`;

        // Check if placeholder email already exists natively to avoid unique constraint
        const checkEmail = await prisma.user.findUnique({ where: { email: newEmail } });
        if (checkEmail) {
            await prisma.user.update({
                where: { id: checkEmail.id },
                data: { role: 'ADMIN', phone: phone || null }
            });
            return res.json({ msg: 'Existing profile upgraded to ADMIN.' });
        }

        await prisma.user.create({
            data: {
                email: newEmail,
                phone: normalizedPhone || null,
                password: 'legacy_not_used', // Unneeded since they log in with Magic codes!
                role: 'ADMIN'
            }
        });

        res.json({ msg: 'New administrator added successfully.' });
    } catch (err) {
        console.error('Add Staff Error:', err.message);
        res.status(500).json({ error: 'Server Error: ' + err.message });
    }
});

// @route   DELETE api/admin/staff/:id
// @desc    Revoke admin access safely
router.delete('/staff/:id', auth, requireAdmin, async (req, res) => {
    const staffId = req.params.id;

    // Prevent deleting yourself
    if (staffId === req.user.id) {
        return res.status(400).json({ msg: 'Cannot delete your own account.' });
    }

    try {
        // Ensure we don't delete the last admin
        const adminCount = await prisma.user.count({
            where: { role: 'ADMIN' }
        });

        if (adminCount <= 1) {
            return res.status(400).json({ msg: 'Cannot remove the last remaining administrator. The system must always have at least one authorized admin.' });
        }

        await prisma.user.delete({
            where: { id: staffId }
        });

        res.json({ msg: 'Admin privileges revoked.' });
    } catch (err) {
        console.error('Revoke Staff Error:', err.message);
        res.status(500).json({ error: 'Server Error: ' + err.message });
    }
});

// @route   PUT api/admin/staff/:id
// @desc    Update staff member details (displayName, etc.)
router.put('/staff/:id', auth, requireAdmin, async (req, res) => {
    try {
        const { displayName } = req.body;
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: { 
                ...(displayName !== undefined && { displayName })
            },
            select: { id: true, displayName: true }
        });
        res.json(user);
    } catch (err) {
        console.error('Update Staff Error:', err.message);
        res.status(500).json({ error: 'Server Error: ' + err.message });
    }
});

// @route   POST api/admin/staff/:id/avatar
// @desc    Upload avatar for a specific staff member
router.post('/staff/:id/avatar', auth, requireAdmin, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: { avatarUrl },
            select: { id: true, avatarUrl: true }
        });
        res.json(user);
    } catch (err) {
        console.error('Avatar Upload Error:', err.message);
        res.status(500).json({ error: 'Server Error: ' + err.message });
    }
});

// @route   PUT api/admin/staff/:id/host
// @desc    Designate a staff member as the responsible host
router.put('/staff/:id/host', auth, requireAdmin, async (req, res) => {
    try {
        // Remove isHost from all other users first
        const hosts = await prisma.user.findMany({ where: { isHost: true }, select: { id: true } });
        await Promise.all(hosts.map(h => 
            prisma.user.update({ where: { id: h.id }, data: { isHost: false } })
        ));
        // Set the selected user as host
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: { isHost: true },
            select: { id: true, isHost: true }
        });
        res.json({ msg: 'Host designation updated.', user });
    } catch (err) {
        console.error('Set Host Error:', err.message);
        res.status(500).json({ error: 'Server Error: ' + err.message });
    }
});

// ── Uplisting V2 Partner Routes ─────────────────────────────────────────────

const { createCustomBookingAttribute, listCustomBookingAttributes, updateV2Booking, getV2BookingStatus } = require('../services/uplistingService');

/**
 * @route   GET api/admin/uplisting/bookings/:uplistingId/status
 * @desc    Check live status of an Uplisting booking. Returns { active: true/false, status }
 *          Used by the admin UI to determine whether to show "Cancel in Uplisting" button.
 * @access  Admin only
 */
router.get('/uplisting/bookings/:uplistingId/status', auth, requireAdmin, async (req, res) => {
    const { uplistingId } = req.params;
    try {
        const result = await getV2BookingStatus(uplistingId);
        const bookingData = result.data?.data;
        const status = bookingData?.attributes?.status || 'unknown';
        // Booking is "active" (still needs manual cancellation) if not already cancelled/archived
        const active = !['cancelled', 'archived', 'declined'].includes(status.toLowerCase());
        console.log(`[Admin] Uplisting booking ${uplistingId} status: ${status} (active=${active})`);
        res.json({ success: true, uplistingId, status, active });
    } catch (err) {
        const httpStatus = err.response?.status;
        const errBody = JSON.stringify(err.response?.data || err.message);
        console.error(`[Admin] Uplisting booking ${uplistingId} status check failed — HTTP ${httpStatus}: ${errBody}`);
        // 404 = booking was deleted from Uplisting → no longer active
        if (httpStatus === 404) {
            return res.json({ success: true, uplistingId, status: 'not_found', active: false });
        }
        // Any other error: fail-safe → assume active so button stays visible
        res.json({ success: true, uplistingId, status: 'error', active: true });
    }
});


/**
 * @route   GET api/admin/uplisting/custom-attributes
 * @desc    List all registered homev_ custom booking attributes in Uplisting.
 * @access  Admin only
 */
router.get('/uplisting/custom-attributes', auth, requireAdmin, async (req, res) => {
    try {
        const result = await listCustomBookingAttributes();
        res.json({ success: true, data: result });
    } catch (err) {
        console.error('[Admin] Uplisting list custom attributes failed:', err.message);
        const status = err.response?.status || 500;
        res.status(status).json({ success: false, error: err.response?.data || err.message });
    }
});

/**
 * @route   POST api/admin/uplisting/custom-attributes
 * @desc    Register a new custom booking attribute in Uplisting (homev_ namespace).
 *          Max 15 attributes per account. Name must start with "homev_".
 * @access  Admin only
 * @body    { name: "homev_attribute_name", description: "What this stores" }
 */
router.post('/uplisting/custom-attributes', auth, requireAdmin, async (req, res) => {
    const { name, description } = req.body;

    if (!name || !description) {
        return res.status(400).json({ error: 'Both "name" and "description" are required.' });
    }

    if (!name.startsWith('homev_')) {
        return res.status(400).json({ error: 'Attribute name must start with "homev_" to comply with the Uplisting namespace requirement.' });
    }

    try {
        const result = await createCustomBookingAttribute(name, description);
        res.status(201).json({ success: true, data: result });
    } catch (err) {
        console.error('[Admin] Uplisting custom attribute creation failed:', err.message);
        const status = err.response?.status || 500;
        res.status(status).json({ success: false, error: err.response?.data || err.message });
    }
});

/**
 * @route   PATCH api/admin/uplisting/bookings/:uplistingId
 * @desc    Manually patch custom attributes onto an existing Uplisting booking.
 *          Useful for backfilling or correcting attribute values.
 * @access  Admin only
 * @body    { homev_payment_source: "stripe", homev_booking_origin: "website", ... }
 */
router.patch('/uplisting/bookings/:uplistingId', auth, requireAdmin, async (req, res) => {
    const { uplistingId } = req.params;
    const attributes = req.body;

    if (!attributes || Object.keys(attributes).length === 0) {
        return res.status(400).json({ error: 'Request body must contain at least one attribute to update.' });
    }

    try {
        const result = await updateV2Booking(uplistingId, attributes);
        res.json({ success: true, data: result });
    } catch (err) {
        console.error(`[Admin] Uplisting booking ${uplistingId} update failed:`, err.message);
        const status = err.response?.status || 500;
        res.status(status).json({ success: false, error: err.response?.data || err.message });
    }
});

module.exports = router;


