const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // 1. Check User
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 2. Check Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 3. Generate Token
        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '5d' }
        );

        res.json({ token });

    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/auth/register (Use this ONCE to create your admin)
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        // Hash password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;