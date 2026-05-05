const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const prisma = require('../db');
const jwt = require('jsonwebtoken');

// Multer config for avatar uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads', 'avatars')),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `admin-${Date.now()}${ext}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, allowed.includes(ext));
    }
});

// Middleware: verify admin token
function requireAdmin(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: 'Not authenticated' });

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (payload.user?.role !== 'SUPER_ADMIN' && payload.user?.role !== 'ADMIN') {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }
        req.adminId = payload.user.id;
        next();
    } catch {
        return res.status(401).json({ success: false, error: 'Invalid token' });
    }
}

// GET /api/admin/profile — fetch admin profile
router.get('/', requireAdmin, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.adminId },
            select: { id: true, email: true, phone: true, displayName: true, bio: true, avatarUrl: true, role: true }
        });
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        res.json({ success: true, data: user });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// PUT /api/admin/profile — update admin profile (name, bio, phone)
router.put('/', requireAdmin, async (req, res) => {
    try {
        const { displayName, bio, phone } = req.body;
        const user = await prisma.user.update({
            where: { id: req.adminId },
            data: {
                ...(displayName !== undefined && { displayName }),
                ...(bio !== undefined && { bio }),
                ...(phone !== undefined && { phone })
            },
            select: { id: true, email: true, phone: true, displayName: true, bio: true, avatarUrl: true, role: true }
        });
        res.json({ success: true, data: user });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /api/admin/profile/avatar — upload avatar image
router.post('/avatar', requireAdmin, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        const user = await prisma.user.update({
            where: { id: req.adminId },
            data: { avatarUrl },
            select: { id: true, avatarUrl: true }
        });
        res.json({ success: true, data: user });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// PUBLIC: GET /api/admin/profile/public — fetch admin profile for guest dashboard
router.get('/public', async (req, res) => {
    try {
        // Get the admin designated as the responsible host
        const host = await prisma.user.findFirst({
            where: { isHost: true, role: 'ADMIN' },
            select: { displayName: true, avatarUrl: true, bio: true }
        });
        res.json({ success: true, data: host || { displayName: 'Your Host', avatarUrl: null, bio: null } });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;
