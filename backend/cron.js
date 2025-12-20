const cron = require('node-cron');
const axios = require('axios');
require('dotenv').config();

const startCronJobs = () => {
    cron.schedule('* * * * *', async () => {
        console.log('⏰ Cron Job: Pinging /api/monitor/crontask...');

        try {
            const PORT = process.env.PORT || 5000;
            const BASE_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;

            const response = await axios.get(`${BASE_URL}/api/monitor/crontask`, {
                headers: {
                    'x-cron-secret': process.env.CRON_SECRET
                }
            });

            console.log(`✅ Cron Ping Success: ${response.data.message}`);

        } catch (error) {
            if (error.response) {
                console.error(`❌ Cron Ping Failed: ${error.response.status} ${error.response.data.message}`);
            } else {
                console.error(`❌ Cron Network Error: ${error.message}`);
            }
        }
    });
};

module.exports = startCronJobs;