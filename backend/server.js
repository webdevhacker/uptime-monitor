require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const mongoose = require('mongoose'); // Import Mongoose
const monitorService = require('./monitorService');
const authRoutes = require('./routes/auth');
const monitorRoutes = require('./routes/monitor');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB 
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/monitor', monitorRoutes);

// Scheduled Task: Run every 5 minutes
cron.schedule('* * * * *', () => {
    monitorService.checkAllSites();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));