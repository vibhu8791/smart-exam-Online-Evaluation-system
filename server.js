const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const adapter = new FileSync('db.json');
const db = low(adapter);

// Set defaults for db
db.defaults({ users: [], exams: [], results: [], custom_questions: {} }).write();

const app = express();
const PORT = process.env.PORT || 3000;

// Export for Vercel
module.exports = app;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Auth Routes
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.get('users').find({ email, password }).value();
    if (user) {
        res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

app.post('/api/auth/signup', (req, res) => {
    const { name, email, password } = req.body;
    const existingUser = db.get('users').find({ email }).value();
    if (existingUser) {
        return res.status(400).json({ success: false, message: 'User already exists' });
    }
    const newUser = { id: uuidv4(), name, email, password, role: 'student' };
    db.get('users').push(newUser).write();
    res.json({ success: true, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } });
});

// Result Routes
app.get('/api/results/:email', (req, res) => {
    const { email } = req.params;
    const results = db.get('results').filter({ userEmail: email }).value();
    res.json(results);
});

app.post('/api/results', (req, res) => {
    const result = { ...req.body, id: Date.now() };
    db.get('results').push(result).write();
    res.json({ success: true, result });
});

// Custom Questions Routes
app.get('/api/custom-questions', (req, res) => {
    const questions = db.get('custom_questions').value();
    res.json(questions);
});

app.post('/api/custom-questions', (req, res) => {
    const { title, questions } = req.body;
    db.set(`custom_questions.${title}`, questions).write();
    res.json({ success: true });
});

app.delete('/api/custom-questions', (req, res) => {
    db.set('custom_questions', {}).write();
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
