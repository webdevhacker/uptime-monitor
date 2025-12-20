const axios = require('axios');
const sslChecker = require('ssl-checker');
const whoiser = require('whoiser');
const nodemailer = require('nodemailer');
const Site = require('./models/Site');
const dns = require('dns').promises;

// Email Configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Helper: Send SSL Specific Alerts (Already Text)
const sendSSLAlert = async (site, daysLeft) => {
    if (!process.env.EMAIL_USER) return;
    console.log(`🔒 Sending SSL Expiry Alert for ${site.url} (${daysLeft} days left)`);

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.TO_MAIL,
            subject: `URGENT: SSL Expiring in ${daysLeft} days - ${site.url}`,
            text: `Action Required: The SSL certificate for ${site.url} will expire in ${daysLeft} days. Please renew it immediately to avoid downtime.`
        });
    } catch (error) {
        console.error('SSL Email failed:', error);
    }
};

// --- UPDATED: Send Uptime/Downtime Alerts (Plain Text) ---
const sendStatusAlert = async (site, status) => {
    if (!process.env.EMAIL_USER) return;

    const isDown = status === 'DOWN';
    const color = isDown ? '#ef4444' : '#22c55e';
    const title = isDown ? 'Website is Down' : 'Website Recovered';
    const icon = isDown ? '🚨' : '✅';
    const dashboardLink = "https://uptimegaurd.isharankumar.com/";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
          <tr>
            <td align="center">
              <table width="600" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
                <tr><td height="6" style="background-color:${color};"></td></tr>
                <tr>
                  <td style="padding:40px;">
                    <div style="text-align:center;margin-bottom:20px;">
                      <span style="font-size:40px;">${icon}</span>
                      <h1 style="color:#111827;margin-top:10px;">${title}</h1>
                      <p style="color:#6b7280;">Status change detected for your monitor.</p>
                    </div>
                    <div style="background-color:#f9fafb;padding:20px;border-radius:6px;border:1px solid #e5e7eb;">
                      <p style="margin:5px 0;color:#6b7280;font-size:14px;"><strong>URL:</strong> <span style="color:#111827;font-family:monospace;">${site.url}</span></p>
                      <p style="margin:5px 0;color:#6b7280;font-size:14px;"><strong>Time:</strong> <span style="color:#111827;">${new Date().toLocaleString()}</span></p>
                      <p style="margin:5px 0;color:#6b7280;font-size:14px;"><strong>Status:</strong> <strong style="color:${color};">${status}</strong></p>
                    </div>
                    <div style="text-align:center;margin-top:30px;">
                      <a href="${dashboardLink}" style="background-color:#111827;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;">Open Dashboard</a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    try {
        await transporter.sendMail({
            from: process.env.SENDER_EMAIL,
            to: process.env.TO_MAIL,
            subject: `${icon} ALERT: ${site.url} is ${status}`,
            html: htmlContent
        });
        console.log(`📧 Status Email sent for ${site.url}`);
    } catch (error) {
        console.error('Status Email failed:', error);
    }
};

// Helper: Robust WHOIS Parser
const getDomainExpiry = async (hostname) => {
    try {
        const domainData = await whoiser(hostname);
        for (const key in domainData) {
            const data = domainData[key];
            const expiry = data['Expiry Date'] ||
                data['Registry Expiry Date'] ||
                data['registrarRegistrationExpirationDate'] ||
                data['expirationDate'];

            if (expiry) return expiry;
        }
        return null;
    } catch (e) {
        return null;
    }
};

// --- MAIN CHECK LOOP ---
exports.checkAllSites = async () => {
    console.log('--- Starting Check Loop ---');
    const sites = await Site.find({});

    for (let site of sites) {
        console.log(`Checking ${site.url}...`);
        let isDirty = false;

        try {
            // --- 1. UPTIME CHECK ---
            const start = Date.now();
            try {
                await axios.get(site.url, { timeout: 10000 });
                const duration = Date.now() - start;

                // FIX: Added await here
                if (site.status === 'DOWN') {
                    sendStatusAlert(site, 'UP');
                }

                site.status = 'UP';
                site.responseTime = duration;
            } catch (err) {
                // FIX: Added await here
                if (site.status === 'UP') {
                    sendStatusAlert(site, 'DOWN');
                }
                site.status = 'DOWN';
            }
            site.lastChecked = Date.now();
            isDirty = true;

            const hostname = new URL(site.url).hostname;

            // --- 2. SSL CHECK & ALERTS ---
            try {
                const sslData = await sslChecker(hostname);

                if (!site.sslInfo) site.sslInfo = {};

                site.sslInfo.valid = !sslData.expired;
                site.sslInfo.daysRemaining = sslData.daysRemaining;
                site.sslInfo.validTo = sslData.validTo;

                const days = sslData.daysRemaining;

                if (days > 30) {
                    if (site.sslInfo.alertSent30 || site.sslInfo.alertSent10) {
                        site.sslInfo.alertSent30 = false;
                        site.sslInfo.alertSent10 = false;
                        isDirty = true;
                    }
                }

                if (days <= 30 && days > 10 && !site.sslInfo.alertSent30) {
                    sendSSLAlert(site, days);
                    site.sslInfo.alertSent30 = true;
                    isDirty = true;
                }

                if (days <= 10 && !site.sslInfo.alertSent10) {
                    sendSSLAlert(site, days);
                    site.sslInfo.alertSent10 = true;
                    site.sslInfo.alertSent30 = true;
                    isDirty = true;
                }

                isDirty = true;
            } catch (e) {
                // SSL check failed
            }

            // --- 3. DOMAIN INFO CHECK ---
            if (!site.domainInfo || !site.domainInfo.expiry || site.domainInfo.expiry === 'Unknown') {
                const expiryDate = await getDomainExpiry(hostname);
                if (expiryDate) {
                    site.domainInfo = { expiry: expiryDate };
                    isDirty = true;
                }
            }

            // --- 4. HOSTING & IP INFO CHECK ---
            if (!site.ipAddress || site.ipAddress === 'Unknown' || !site.hosting) {
                try {
                    const { address } = await dns.lookup(hostname);
                    if (address) {
                        site.ipAddress = address;
                        isDirty = true;
                        const geoRes = await axios.get(`http://ip-api.com/json/${address}`);
                        if (geoRes.data) {
                            site.hosting = geoRes.data.isp || geoRes.data.org || 'Unknown';
                        }
                    }
                } catch (e) {
                    console.error(`DNS/Hosting lookup failed for ${hostname}:`, e.message);
                }
            }

            // --- SAVE TO DB ---
            if (isDirty) {
                site.markModified('sslInfo');
                await site.save();
            }

        } catch (error) {
            console.error(`Error checking ${site.url}:`, error.message);
        }
    }
    console.log('--- Check Loop Completed ---');
};