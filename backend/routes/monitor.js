const express = require('express');
const router = express.Router();
const Site = require('../models/Site');
const { checkAllSites } = require('../monitorService');
const jwt = require('jsonwebtoken');

// 👇 1. FIXED MIDDLEWARE (Uses the correct Secret)
const authenticate = (req, res, next) => {
    // Check for token in 'x-auth-token' (Standard) or 'Authorization'
    const token = req.header('x-auth-token') || req.headers['authorization'];

    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    try {
        const tokenString = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;
        const decoded = jwt.verify(tokenString, process.env.JWT_SECRET);

        req.user = decoded;
        next();
    } catch (e) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// GET all sites (Protected)
router.get('/', authenticate, async (req, res) => {
    try {
        const sites = await Site.find().sort({ lastChecked: -1 });
        res.json(sites);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST add new site (Protected)
router.post('/add', authenticate, async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ message: "URL is required" });

        const existingSite = await Site.findOne({ url });
        if (existingSite) {
            return res.status(409).json({ message: 'This website is already being monitored.' });
        }

        const newSite = new Site({
            url,
            status: 'PENDING'
        });

        await newSite.save();
        res.status(201).json(newSite);

    } catch (error) {
        console.error('Error adding site:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// DELETE site (Protected)
router.delete('/:id', authenticate, async (req, res) => {
    try {
        await Site.findByIdAndDelete(req.params.id);
        res.json({ message: 'Site deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting site' });
    }
});

// CRON TASK (For Vercel Cron Jobs)
router.get('/crontask', async (req, res) => {
    try {
        // Optional: Secure this route so only Vercel can call it
        const secret = req.headers['authorization'];
        // if (secret !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).send('Unauthorized');

        console.log('🔄 Cron Triggered: Checking Sites...');

        // ⚠️ CRITICAL FIX FOR VERCEL: You MUST use 'await'
        // If you don't await, Vercel kills the server before checks finish.
        await checkAllSites();

        res.status(200).json({ message: 'Monitoring Completed' });

    } catch (error) {
        console.error("Cron Failed:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;