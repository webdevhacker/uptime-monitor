const express = require('express');
const router = express.Router();
const Site = require('../models/Site'); // Import Model
const monitorService = require('../monitorService');
const jwt = require('jsonwebtoken');
const auth = require('../routes/auth');
const { checkAllSites, checkSite } = require('../monitorService');
// Middleware
const authenticate = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).send('Token required');
    try {
        const bearer = token.split(' ')[1];
        jwt.verify(bearer, process.env.ADMIN_SECRET);
        next();
    } catch (e) {
        res.status(401).send('Invalid Token');
    }
};

// GET all sites from DB
router.get('/', authenticate, async (req, res) => {
    try {
        const sites = await Site.find().sort({ lastChecked: -1 });
        res.json(sites);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST add new site to DB
router.post('/add', auth, async (req, res) => {
    try {
        const { url } = req.body;

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

router.delete('/:id', authenticate, async (req, res) => {
    try {
        await Site.findByIdAndDelete(req.params.id);
        res.json({ message: 'Site deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting site' });
    }
});

router.get('/crontask', async (req, res) => {
    try {
        const secret = req.headers['x-cron-secret'];

        if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
            return res.status(403).json({ message: 'Unauthorized: Invalid Secret' });
        }

        console.log('🔄 API Route Triggered: Starting Check Loop...');

        checkAllSites();

        res.status(200).json({ message: 'Monitoring job started successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;