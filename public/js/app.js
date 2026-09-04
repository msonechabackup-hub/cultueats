let selectedRestaurant = null;
let map;

document.addEventListener('DOMContentLoaded', () => {
  initMap();
  fetchRestaurants();
});

function initMap() {
  map = L.map('map').setView([22.3039, 70.8022], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);
}

function selectCuisine(cuisine) {
  const splash = document.getElementById('splash-screen');
  if (splash) {
    splash.classList.add('opacity-0', 'pointer-events-none');
    setTimeout(() => splash.remove(), 700);
  }
  fetchRestaurants(cuisine);
}

async function fetchRestaurants(cuisine = '') {
  try {
    const url = cuisine ? `/api/restaurants?cuisine=${encodeURIComponent(cuisine)}` : '/api/restaurants';
    const res = await fetch(url);
    const data = await res.json();
    renderRestaurants(data);
  } catch (err) {
    console.error('Failed to load restaurants:', err);
  }
}

function renderRestaurants(restaurants) {
  const container = document.getElementById('restaurant-grid');
  if (!container) return;
  
  container.innerHTML = restaurants.map(r => `
    <div class="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 transition duration-300 flex flex-col justify-between">
      <div>
        <div class="flex justify-between items-start mb-2">
          <h3 class="font-black text-lg text-white">${r.name}</h3>
          <span class="text-xs bg-amber-500/10 text-amber-400 font-bold px-2.5 py-1 rounded-lg border border-amber-500/20">${r.cuisine}</span>
        </div>
        <p class="text-xs text-slate-400 mb-4">${r.description || 'Authentic regional dining experience.'}</p>
      </div>
      <button onclick="triggerBooking('${r._id}', '${r.name}')" class="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-2.5 rounded-xl text-xs transition">
        Reserve Table
      </button>
    </div>
  `).join('');
}

function triggerBooking(id, name) {
  selectedRestaurant = { id, name };
  document.getElementById('ad-modal').classList.remove('hidden');
}

function startAd() {
  document.getElementById('ad-prompt').classList.add('hidden');
  document.getElementById('ad-viewer').classList.remove('hidden');
  const bar = document.getElementById('ad-progress');
  bar.style.width = '100%';
  
  setTimeout(() => {
    document.getElementById('ad-viewer').classList.add('hidden');
    document.getElementById('ad-email-form').classList.remove('hidden');
  }, 5000);
}

function skipAd() {
  document.getElementById('ad-modal').classList.add('hidden');
}

async function sendDiscountEmail() {
  const email = document.getElementById('user-email').value;
  if (!email) return alert('Please enter your email');
  
  try {
    const res = await fetch('/api/book-discount', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, restaurantName: selectedRestaurant.name })
    });
    const data = await res.json();
    alert(data.message || 'Discount code sent!');
    document.getElementById('ad-modal').classList.add('hidden');
  } catch (err) {
    alert('Error sending code.');
  }
}
