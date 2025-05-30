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

// MySQL connection using Railway's public network
const db = mysql.createConnection({
  host: 'switchyard.proxy.rlwy.net',
  port: 37088,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'railway'
});

// Handle database connection errors
db.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to MySQL database');
  
  // Create tables if they don't exist
  const createTables = `
    CREATE TABLE IF NOT EXISTS admins (
      admin_id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS feedbacks (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL,
      feedback TEXT NOT NULL,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  db.query(createTables, (err) => {
    if (err) {
      console.error('Error creating tables:', err);
      return;
    }
    console.log('Tables created or already exist');

    // Insert default admin if not exists
    const insertAdmin = `
      INSERT IGNORE INTO admins (name, email, password)
      VALUES ('Admin User', 'admin@admin.com', 'password')
    `;
    db.query(insertAdmin, (err) => {
      if (err) {
        console.error('Error inserting default admin:', err);
        return;
      }
      console.log('Default admin created or already exists');
    });
  });
});

// Handle database disconnection
db.on('error', (err) => {
  console.error('Database error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    // Reconnect if connection is lost
    db.connect();
  } else {
    throw err;
  }
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