const axios = require('axios');
const sslChecker = require('ssl-checker');
const nodemailer = require('nodemailer');
const Site = require('./models/Site');
const dns = require('dns').promises;

// --- EMAIL CONFIGURATION ---
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// --- HELPER 1: SSL ALERT ---
const sendSSLAlert = async (site, daysLeft) => {
    if (!process.env.EMAIL_USER) return;
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.TO_MAIL,
            subject: `URGENT: SSL Expiring in ${daysLeft} days - ${site.url}`,
            text: `Action Required: The SSL certificate for ${site.url} will expire in ${daysLeft} days.`
        });
        console.log(`📧 SSL Alert sent for ${site.url}`);
    } catch (error) {
        console.error('SSL Email failed:', error.message);
    }
};

// --- HELPER 2: STATUS ALERT (HTML) ---
const sendStatusAlert = async (site, status) => {
    if (!process.env.EMAIL_USER) return;

    const isDown = status === 'DOWN';
    const color = isDown ? '#ef4444' : '#22c55e';
    const title = isDown ? 'Website is Down' : 'Website Recovered';
    const icon = isDown ? '🚨' : '✅';
    const dashboardLink = "https://uptimegaurd.isharankumar.com/";

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; border-top: 6px solid ${color};">
            <h1 style="text-align: center; color: #111827;">${icon} ${title}</h1>
            <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <p><strong>URL:</strong> ${site.url}</p>
                <p><strong>Status:</strong> <span style="color: ${color}; font-weight: bold;">${status}</span></p>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <div style="text-align: center;">
                <a href="${dashboardLink}" style="background: #111827; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Open Dashboard</a>
            </div>
        </div>
      </div>
    `;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.TO_MAIL,
            subject: `${icon} ALERT: ${site.url} is ${status}`,
            html: htmlContent
        });
        console.log(`📧 Status Email sent for ${site.url}`);
    } catch (error) {
        console.error('Status Email failed:', error.message);
    }
};

// --- MAIN FUNCTION: PARALLEL CHECK ---
exports.checkAllSites = async () => {
    console.log('🚀 Starting Parallel Check Loop...');

    // 1. Get all sites
    const sites = await Site.find({});
    if (sites.length === 0) {
        console.log("No sites to check.");
        return;
    }

    // 2. Map sites to Promises (Run all at once)
    const checks = sites.map(async (site) => {
        let isDirty = false;

        try {
            // --- A. UPTIME CHECK ---
            const start = Date.now();
            try {
                // Reduced timeout to 5s to fit Vercel limits
                await axios.get(site.url, { timeout: 5000 });
                const duration = Date.now() - start;

                if (site.status === 'DOWN') {
                    sendStatusAlert(site, 'UP');
                }

                site.status = 'UP';
                site.responseTime = duration;
            } catch (err) {
                if (site.status === 'UP') {
                    sendStatusAlert(site, 'DOWN');
                }
                site.status = 'DOWN';
            }
            site.lastChecked = Date.now();
            isDirty = true;

            // --- B. SSL & INFO CHECK (Only if site is UP to save time) ---
            if (site.status === 'UP') {
                const hostname = new URL(site.url).hostname;

                // SSL Check
                try {
                    const sslData = await sslChecker(hostname);
                    if (!site.sslInfo) site.sslInfo = {};

                    site.sslInfo.valid = !sslData.expired;
                    site.sslInfo.daysRemaining = sslData.daysRemaining;
                    site.sslInfo.validTo = sslData.validTo;

                    const days = sslData.daysRemaining;
                    if (days > 30 && (site.sslInfo.alertSent30 || site.sslInfo.alertSent10)) {
                        site.sslInfo.alertSent30 = false;
                        site.sslInfo.alertSent10 = false;
                    } else if (days <= 30 && days > 10 && !site.sslInfo.alertSent30) {
                        sendSSLAlert(site, days);
                        site.sslInfo.alertSent30 = true;
                    } else if (days <= 10 && !site.sslInfo.alertSent10) {
                        sendSSLAlert(site, days);
                        site.sslInfo.alertSent10 = true;
                    }
                } catch (e) { /* SSL Failed, ignore */ }

                // DNS/Hosting Check (Only if missing)
                if (!site.ipAddress || site.ipAddress === 'Unknown') {
                    try {
                        const { address } = await dns.lookup(hostname);
                        if (address) {
                            site.ipAddress = address;
                            const geoRes = await axios.get(`http://ip-api.com/json/${address}`);
                            if (geoRes.data) site.hosting = geoRes.data.isp || 'Unknown';
                        }
                    } catch (e) { /* DNS Failed, ignore */ }
                }
            }

            // --- SAVE DB ---
            if (isDirty) {
                site.markModified('sslInfo');
                await site.save();
            }

        } catch (error) {
            console.error(`❌ Critical Error checking ${site.url}:`, error.message);
        }
    });

    await Promise.all(checks);
    console.log('✅ All Checks Completed');
};