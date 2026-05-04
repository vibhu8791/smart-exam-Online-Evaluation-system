require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const { User, Result, CustomQuestion } = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// Export for Vercel
module.exports = app;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// MongoDB Connection with detailed error handling
if (MONGO_URI) {
    console.log('Attempting to connect to MongoDB...');
    mongoose.connect(MONGO_URI)
        .then(() => console.log('✅ Successfully connected to MongoDB Atlas'))
        .catch(err => {
            console.error('❌ MongoDB connection error:', err.message);
            console.error('👉 Tip: Check your MONGO_URI and ensure "Network Access" in MongoDB Atlas allows 0.0.0.0/0');
        });
} else {
    console.warn('⚠️ Warning: MONGO_URI environment variable is missing.');
}

// Helper to check DB status
const checkDb = (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ 
            success: false, 
            message: 'Database is not connected. Please ensure MongoDB Atlas Network Access allows connections from all IPs (0.0.0.0/0).' 
        });
    }
    next();
};

// Auth Routes
app.post('/api/auth/login', checkDb, async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Hardcoded admin check for convenience
        if (email === 'admin@smartexam.com' && password === 'admin123') {
            return res.json({ success: true, user: { id: 'admin', name: 'Admin', email, role: 'admin' } });
        }

        const user = await User.findOne({ email, password });
        if (user) {
            res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
});

app.post('/api/auth/signup', checkDb, async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }
        const newUser = new User({ name, email, password, role: 'student' });
        await newUser.save();
        res.json({ success: true, user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error during signup' });
    }
});

// Result Routes
app.get('/api/results/:email', checkDb, async (req, res) => {
    try {
        const { email } = req.params;
        const results = await Result.find({ userEmail: email }).sort({ _id: -1 });
        res.json(results);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching results' });
    }
});

app.post('/api/results', checkDb, async (req, res) => {
    try {
        const result = new Result(req.body);
        await result.save();
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error saving result' });
    }
});

// Custom Questions Routes
app.get('/api/custom-questions', checkDb, async (req, res) => {
    try {
        const allCustom = await CustomQuestion.find();
        const formatted = {};
        allCustom.forEach(item => {
            formatted[item.title] = item.questions;
        });
        res.json(formatted);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching custom questions' });
    }
});

app.post('/api/custom-questions', checkDb, async (req, res) => {
    try {
        const { title, questions } = req.body;
        await CustomQuestion.findOneAndUpdate(
            { title },
            { questions },
            { upsert: true, new: true }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error saving custom questions' });
    }
});

app.delete('/api/custom-questions', checkDb, async (req, res) => {
    try {
        await CustomQuestion.deleteMany({});
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error clearing custom questions' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
