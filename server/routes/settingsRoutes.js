const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { protect: auth } = require('../middleware/auth');

// Middleware to enforce admin-only access
const requireAdmin = async (req, res, next) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

/**
 * @route   GET /api/settings
 * @desc    Get all site settings (public — used by Contact Us page)
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const rows = await prisma.siteSetting.findMany();
        // Convert array of { key, value } into a plain object
        const settings = {};
        for (const row of rows) {
            try {
                settings[row.key] = JSON.parse(row.value);
            } catch {
                settings[row.key] = row.value;
            }
        }
        res.json({ success: true, data: settings });
    } catch (err) {
        console.error('[Settings GET] Error:', err.message);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

/**
 * @route   PUT /api/settings
 * @desc    Upsert one or more site settings (admin only)
 * @access  Admin
 * @body    { contact_email: "...", social_links: [...], ... }
 */
router.put('/', auth, requireAdmin, async (req, res) => {
    try {
        const updates = req.body;
        if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
            return res.status(400).json({ error: 'Request body must be a plain object of key-value settings' });
        }

        const upserts = Object.entries(updates).map(([key, value]) =>
            prisma.siteSetting.upsert({
                where: { key },
                update: { value: typeof value === 'string' ? value : JSON.stringify(value) },
                create: { key, value: typeof value === 'string' ? value : JSON.stringify(value) },
            })
        );

        await Promise.all(upserts);

        // Return fresh snapshot of all settings
        const rows = await prisma.siteSetting.findMany();
        const settings = {};
        for (const row of rows) {
            try {
                settings[row.key] = JSON.parse(row.value);
            } catch {
                settings[row.key] = row.value;
            }
        }

        res.json({ success: true, data: settings });
    } catch (err) {
        console.error('[Settings PUT] Error:', err.message);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
