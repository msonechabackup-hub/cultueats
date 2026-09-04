const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// JSON File DB Helpers
const DB_RESTO = path.join(__dirname, 'db', 'restaurants.json');
const DB_PENDING = path.join(__dirname, 'db', 'pending.json');
const DB_CUSTOMERS = path.join(__dirname, 'db', 'customers.json');

const readJSON = (filePath) => {
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    return [];
  }
};

const writeJSON = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
};

// Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'views', 'admin.html')));
app.get('/partner', (req, res) => res.sendFile(path.join(__dirname, 'views', 'partner.html')));

// API Endpoints
app.get('/api/restaurants', (req, res) => {
  res.json(readJSON(DB_RESTO));
});

app.get('/api/admin/pending', (req, res) => {
  res.json(readJSON(DB_PENDING));
});

app.get('/api/admin/customers', (req, res) => {
  res.json(readJSON(DB_CUSTOMERS));
});

app.post('/api/partner/register', (req, res) => {
  const pending = readJSON(DB_PENDING);
  const newReq = {
    id: Date.now(),
    ...req.body,
    appliedDate: new Date().toISOString().split('T')[0],
    status: "Pending"
  };
  pending.push(newReq);
  writeJSON(DB_PENDING, pending);
  res.json({ success: true, message: "Application submitted for admin review!" });
});

app.post('/api/admin/approve/:id', (req, res) => {
  const reqId = parseInt(req.params.id);
  let pending = readJSON(DB_PENDING);
  let approved = readJSON(DB_RESTO);

  const index = pending.findIndex(r => r.id === reqId);
  if (index !== -1) {
    const [resto] = pending.splice(index, 1);
    
    // Assign robust map defaults so map rendering never fails
    resto.status = "Approved";
    resto.rating = resto.rating || 5.0;
    resto.lat = parseFloat(resto.lat) || (23.0225 + (Math.random() - 0.5) * 0.05);
    resto.lng = parseFloat(resto.lng) || (72.5714 + (Math.random() - 0.5) * 0.05);
    resto.cover = resto.cover || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80';

    approved.push(resto);
    writeJSON(DB_PENDING, pending);
    writeJSON(DB_RESTO, approved);

    return res.json({ success: true, message: "Restaurant approved and published to map!" });
  }

  res.status(404).json({ success: false, message: "Request not found" });
});

app.post('/api/admin/reject/:id', (req, res) => {
  const reqId = parseInt(req.params.id);
  let pending = readJSON(DB_PENDING);
  pending = pending.filter(r => r.id !== reqId);
  writeJSON(DB_PENDING, pending);
  res.json({ success: true, message: "Application rejected." });
});

app.listen(PORT, () => console.log(`CultuEats Platform running on http://localhost:${PORT}`));
