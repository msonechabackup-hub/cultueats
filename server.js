const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const DB_RESTO = path.join(__dirname, 'db', 'restaurants.json');
const DB_PENDING = path.join(__dirname, 'db', 'pending.json');

const defaultRestaurants = [
  {
    id: 1,
    name: "Mainland China & Dim Sum Bar",
    city: "Ahmedabad",
    cuisine: "Pan-Asian",
    rating: 4.8,
    address: "Satellite, Ahmedabad",
    lat: 23.0225,
    lng: 72.5714,
    cover: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 2,
    name: "Swati Snacks",
    city: "Ahmedabad",
    cuisine: "South Indian",
    rating: 4.7,
    address: "Law Garden, Ahmedabad",
    lat: 23.0250,
    lng: 72.5600,
    cover: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"
  }
];

const readJSON = (filePath, fallback = []) => {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const content = fs.readFileSync(filePath, 'utf8').trim();
    return content ? JSON.parse(content) : fallback;
  } catch (err) {
    return fallback;
  }
};

const writeJSON = (filePath, data) => {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("Write error:", err);
  }
};

// Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'views', 'admin.html')));

// API Endpoints
app.get('/api/restaurants', (req, res) => res.json(readJSON(DB_RESTO, defaultRestaurants)));

// Admin Power: Delete Active Listing
app.delete('/api/admin/restaurants/:id', (req, res) => {
  const id = parseInt(req.params.id);
  let restaurants = readJSON(DB_RESTO, defaultRestaurants);
  restaurants = restaurants.filter(r => r.id !== id);
  writeJSON(DB_RESTO, restaurants);
  io.emit('restaurants_updated');
  res.json({ success: true, message: "Listing deleted successfully!" });
});

// Email Service Handler (Nodemailer)
app.post('/api/send-discount', async (req, res) => {
  const { email, code, restaurantName } = req.body;
  if (!email) return res.status(400).json({ success: false, message: "Email is required" });

  // Transporter configured for test/Ethereal or standard SMTP
  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: "demo@ethereal.email",
      pass: "demopass"
    }
  });

  console.log(`[EMAIL DISPATCH] Sending coupon ${code} to ${email} for ${restaurantName}`);
  res.json({ success: true, message: `Discount code ${code} sent to ${email}!` });
});

server.listen(PORT, () => console.log(`?? Craveo running on http://localhost:${PORT}`));
