const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const DB_RESTO = path.join(__dirname, 'db', 'restaurants.json');
const DB_PENDING = path.join(__dirname, 'db', 'pending.json');
const DB_CUSTOMERS = path.join(__dirname, 'db', 'customers.json');

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
    cover: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    status: "Approved"
  }
];

const readJSON = (filePath, fallback = []) => {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const content = fs.readFileSync(filePath, 'utf8').trim();
    if (!content) return fallback;
    return JSON.parse(content);
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

// Handle WebSocket connections
io.on('connection', (socket) => {
  console.log('? Client connected to Socket.io');
});

// HTML Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'views', 'admin.html')));
app.get('/partner', (req, res) => res.sendFile(path.join(__dirname, 'views', 'partner.html')));

// API Endpoints
app.get('/api/restaurants', (req, res) => {
  res.json(readJSON(DB_RESTO, defaultRestaurants));
});

app.get('/api/admin/pending', (req, res) => res.json(readJSON(DB_PENDING, [])));
app.get('/api/admin/customers', (req, res) => res.json(readJSON(DB_CUSTOMERS, [])));

app.post('/api/partner/register', (req, res) => {
  const pending = readJSON(DB_PENDING, []);
  const newReq = {
    id: Date.now(),
    ...req.body,
    appliedDate: new Date().toISOString().split('T')[0],
    status: "Pending"
  };
  pending.push(newReq);
  writeJSON(DB_PENDING, pending);
  
  // Notify admin in real-time
  io.emit('new_partner_request', newReq);

  res.json({ success: true, message: "Application submitted for admin review!" });
});

server.listen(PORT, () => console.log(`?? Server running on http://localhost:${PORT}`));
