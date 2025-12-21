const express = require('express');
const router = express.Router();
const Site = require('../models/Site');
const { checkAllSites } = require('../monitorService');
const jwt = require('jsonwebtoken');

// --- MIDDLEWARE: PROTECT DASHBOARD ROUTES ---
const authenticate = (req, res, next) => {
    // Accepts 'x-auth-token' OR 'Authorization: Bearer <token>'
    const token = req.header('x-auth-token') || req.headers['authorization'];

    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    try {
        const tokenString = token.startsWith('Bearer ') ? token.slice(7).trim() : token;
        // Uses JWT_SECRET (Matches auth.js)
        const decoded = jwt.verify(tokenString, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

router.get('/crontask', async (req, res) => {
    try {
        const secret = req.headers['x-cron-secret'];

        // 1. Verify it's actually FastCron calling
        if (secret !== process.env.CRON_SECRET) {
            console.log("⛔ Unauthorized Cron Attempt");
            return res.status(403).json({ message: 'Unauthorized' });
        }

        console.log('🔄 FastCron Triggered...');

        await checkAllSites();

        res.status(200).json({ message: 'Monitoring Completed Successfully' });

    } catch (error) {
        console.error("Cron Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// --- ROUTE 2: GET ALL SITES (Protected) ---
router.get('/', authenticate, async (req, res) => {
    try {
        const sites = await Site.find().sort({ lastChecked: -1 });
        res.json(sites);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- ROUTE 3: ADD SITE (Protected) ---
router.post('/add', authenticate, async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ message: "URL is required" });

        const existingSite = await Site.findOne({ url });
        if (existingSite) return res.status(409).json({ message: 'Site already exists' });

        const newSite = new Site({ url, status: 'PENDING' });
        await newSite.save();
        res.status(201).json(newSite);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// --- ROUTE 4: DELETE SITE (Protected) ---
router.delete('/:id', authenticate, async (req, res) => {
    try {
        await Site.findByIdAndDelete(req.params.id);
        res.json({ message: 'Site deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting site' });
    }
});

module.exports = router;