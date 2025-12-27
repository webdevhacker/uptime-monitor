const mongoose = require('mongoose');

const SiteSchema = new mongoose.Schema({
    url: { type: String, required: true },
    status: { type: String, default: 'PENDING' },
    responseTime: { type: Number, default: 0 },
    downSince: { type: Date, default: null },
    sslInfo: {
        valid: Boolean,
        daysRemaining: Number,
        validTo: String,
        error: String,
        alertSent30: { type: Boolean, default: false },
        alertSent10: { type: Boolean, default: false }
    },
    domainInfo: {
        expiry: String
    },
    hosting: { type: String, default: 'Pending...' },
    ipAddress: { type: String, default: 'Unknown' },
    lastChecked: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Site', SiteSchema);