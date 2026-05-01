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

// MongoDB Connection
if (MONGO_URI) {
    mongoose.connect(MONGO_URI)
        .then(() => console.log('Connected to MongoDB Atlas'))
        .catch(err => console.error('MongoDB connection error:', err));
} else {
    console.warn('Warning: MONGO_URI not found in environment variables.');
}

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
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

app.post('/api/auth/signup', async (req, res) => {
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
app.get('/api/results/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const results = await Result.find({ userEmail: email });
        res.json(results);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching results' });
    }
});

app.post('/api/results', async (req, res) => {
    try {
        const result = new Result(req.body);
        await result.save();
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error saving result' });
    }
});

// Custom Questions Routes
app.get('/api/custom-questions', async (req, res) => {
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

app.post('/api/custom-questions', async (req, res) => {
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

app.delete('/api/custom-questions', async (req, res) => {
    try {
        await CustomQuestion.deleteMany({});
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error clearing custom questions' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
