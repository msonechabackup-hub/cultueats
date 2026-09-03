const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jwt-simple');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const SECRET_KEY = 'cultueats_secret';
const db = new sqlite3.Database(':memory:');

// Database Setup
db.serialize(() => {
  db.run(`CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT UNIQUE, password TEXT, role TEXT)`);
  db.run(`CREATE TABLE restaurants (id INTEGER PRIMARY KEY, owner_id INTEGER, name TEXT, city TEXT, cuisine TEXT, address TEXT, lat REAL, lng REAL, rating REAL, menu TEXT)`);
  db.run(`CREATE TABLE coupons (id INTEGER PRIMARY KEY, restaurant_id INTEGER, code TEXT, discount INTEGER)`);
  db.run(`CREATE TABLE reservations (id INTEGER PRIMARY KEY, restaurant_id INTEGER, customer_name TEXT, party_size INTEGER, booking_time TEXT, coupon_code TEXT, status TEXT DEFAULT 'Confirmed')`);
  db.run(`CREATE TABLE messages (id INTEGER PRIMARY KEY, restaurant_id INTEGER, sender TEXT, text TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)`);

  // Seed Data
  db.run(`INSERT INTO users (name, email, password, role) VALUES ('Admin Resto', 'owner@china.com', '123456', 'restaurant'), ('John Doe', 'john@gmail.com', '123456', 'customer')`);
  db.run(`INSERT INTO restaurants (owner_id, name, city, cuisine, address, lat, lng, rating, menu) VALUES 
    (1, 'Mainland China', 'Ahmedabad', 'Chinese', 'Gulbai Tekra, Ahmedabad', 23.0258, 72.5568, 4.5, 'Dim Sum - ₹350, Hakka Noodles - ₹280, Manchurian - ₹320'),
    (1, 'Crazy Noodles', 'Ahmedabad', 'Chinese', 'CG Road, Ahmedabad', 23.0333, 72.5623, 4.2, 'Ramen Bowl - ₹400, Chili Paneer - ₹260')`);
  db.run(`INSERT INTO coupons (restaurant_id, code, discount) VALUES (1, 'CHINA20', 20)`);
});

// Auth Routes
app.post('/api/register', (req, res) => {
  const { name, email, password, role } = req.body;
  db.run(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`, [name, email, password, role], function(err) {
    if (err) return res.status(400).json({ error: 'Email already exists' });
    const token = jwt.encode({ id: this.lastID, role, name }, SECRET_KEY);
    res.json({ success: true, token, role, name });
  });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.get(`SELECT * FROM users WHERE email = ? AND password = ?`, [email, password], (err, user) => {
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.encode({ id: user.id, role: user.role, name: user.name }, SECRET_KEY);
    res.json({ success: true, token, role: user.role, name: user.name, id: user.id });
  });
});

// Restaurant Routes
app.get('/api/restaurants', (req, res) => {
  const { city, cuisine } = req.query;
  db.all(`SELECT * FROM restaurants WHERE LOWER(city) LIKE LOWER(?) AND LOWER(cuisine) LIKE LOWER(?)`, [`%${city||''}%`, `%${cuisine||''}%`], (err, rows) => {
    res.json(rows || []);
  });
});

app.post('/api/coupons', (req, res) => {
  const { restaurant_id, code, discount } = req.body;
  db.run(`INSERT INTO coupons (restaurant_id, code, discount) VALUES (?, ?, ?)`, [restaurant_id, code, discount], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, code, discount });
  });
});

// Reservation Route
app.post('/api/reservations', (req, res) => {
  const { restaurant_id, customer_name, party_size, booking_time, coupon_code } = req.body;
  db.get(`SELECT * FROM coupons WHERE restaurant_id = ? AND code = ?`, [restaurant_id, coupon_code], (err, coupon) => {
    if (coupon_code && !coupon) return res.status(400).json({ error: 'Invalid Coupon' });
    db.run(`INSERT INTO reservations (restaurant_id, customer_name, party_size, booking_time, coupon_code) VALUES (?, ?, ?, ?, ?)`,
      [restaurant_id, customer_name, party_size, booking_time, coupon_code || 'NONE'], function(err) {
        const booking = { id: this.lastID, restaurant_id, customer_name, party_size, booking_time, coupon_code: coupon_code || 'NONE' };
        io.emit(`booking_resto_${restaurant_id}`, booking); // Socket event to restaurant staff
        res.json({ success: true, booking, discount: coupon ? coupon.discount : 0 });
      });
  });
});

app.get('/api/reservations/:restoId', (req, res) => {
  db.all(`SELECT * FROM reservations WHERE restaurant_id = ?`, [req.params.restoId], (err, rows) => res.json(rows || []));
});

// Socket.io Messaging
io.on('connection', (socket) => {
  socket.on('join_chat', (restoId) => socket.join(`chat_${restoId}`));
  socket.on('send_message', (data) => {
    db.run(`INSERT INTO messages (restaurant_id, sender, text) VALUES (?, ?, ?)`, [data.restoId, data.sender, data.text]);
    io.to(`chat_${data.restoId}`).emit('receive_message', data);
  });
});

app.get('/api/messages/:restoId', (req, res) => {
  db.all(`SELECT * FROM messages WHERE restaurant_id = ? ORDER BY id ASC`, [req.params.restoId], (err, rows) => res.json(rows || []));
});

server.listen(3000, () => console.log('CultuEats upgraded server running on http://localhost:3000'));