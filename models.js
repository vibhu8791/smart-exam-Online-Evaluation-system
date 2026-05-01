const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'admin'], default: 'student' }
});

// Result Schema
const resultSchema = new mongoose.Schema({
    userEmail: { type: String, required: true },
    title: { type: String, required: true },
    date: { type: String, required: true },
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    percentage: { type: String, required: true },
    review: [{
        q: String,
        options: [String],
        correct: Number,
        userAnswer: Number
    }]
});

// Custom Question Schema
const customQuestionSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true },
    questions: [{
        q: String,
        options: [String],
        correct: Number,
        timestamp: { type: Number, default: Date.now }
    }]
});

const User = mongoose.model('User', userSchema);
const Result = mongoose.model('Result', resultSchema);
const CustomQuestion = mongoose.model('CustomQuestion', customQuestionSchema);

module.exports = { User, Result, CustomQuestion };
