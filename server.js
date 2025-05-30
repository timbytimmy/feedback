const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');
require('dotenv').config();
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password', // Set your MySQL password
  database: 'CUSTOMERFEEDBACK'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

const admins = [
  {
    admin_id: 1,
    name: 'Admin User',
    email: 'admin@admin.com',
    password: 'password' // In a real app, this would be hashed
  }
];

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  const admin = admins.find(a => a.email === email && a.password === password);
  if (!admin) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const token = jwt.sign({ id: admin.admin_id }, 'your_jwt_secret', { expiresIn: '1h' });
  res.json({ token, admin: { id: admin.admin_id, name: admin.name, email: admin.email } });
});

// Middleware to check admin JWT
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  jwt.verify(token, 'your_jwt_secret', (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.adminId = decoded.id;
    next();
  });
}

// Client submits feedback (store in MySQL)
app.post('/api/feedback', (req, res) => {
  const { name, email, feedback } = req.body;
  if (!name || !email || !feedback) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  const query = 'INSERT INTO feedbacks (name, email, feedback, submitted_at) VALUES (?, ?, ?, NOW())';
  db.query(query, [name, email, feedback], (err, result) => {
    if (err) {
      console.error('Error inserting feedback:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Feedback submitted successfully' });
  });
});

// Admin views all feedback (fetch from MySQL)
app.get('/api/feedback', authenticateAdmin, (req, res) => {
  const query = 'SELECT * FROM feedbacks ORDER BY submitted_at DESC';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching feedback:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// Serve client feedback form at /
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve admin dashboard at /admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 