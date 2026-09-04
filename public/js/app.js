let map;
let markersGroup;

document.addEventListener('DOMContentLoaded', () => {
  initMap();
  fetchRestaurants();
});

function initMap() {
  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  try {
    map = L.map('map').setView([23.0225, 72.5714], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);
    
    markersGroup = L.layerGroup().addTo(map);

    // Force tile recalculation after DOM load
    setTimeout(() => { if (map) map.invalidateSize(); }, 400);
  } catch (err) {
    console.error("Leaflet initialization error:", err);
  }
}

async function fetchRestaurants() {
  try {
    const res = await fetch('/api/restaurants');
    const data = await res.json();
    renderRestaurants(data);
    renderMapMarkers(data);
  } catch (err) {
    console.error("API error:", err);
  }
}

function renderMapMarkers(restaurants) {
  if (!map || !markersGroup || !Array.isArray(restaurants)) return;
  markersGroup.clearLayers();

  const bounds = [];
  restaurants.forEach(r => {
    const lat = parseFloat(r.lat) || 23.0225;
    const lng = parseFloat(r.lng) || 72.5714;
    const marker = L.marker([lat, lng]).bindPopup(`<b>${r.name}</b><br>${r.cuisine || ''}`);
    markersGroup.addLayer(marker);
    bounds.push([lat, lng]);
  });

  if (bounds.length > 0) map.fitBounds(bounds, { padding: [20, 20], maxZoom: 14 });
  map.invalidateSize();
}

function renderRestaurants(restaurants) {
  const grid = document.getElementById('restaurant-grid');
  if (!grid) return;
  grid.innerHTML = '';

  if (!Array.isArray(restaurants) || restaurants.length === 0) {
    grid.innerHTML = '<p class="text-xs text-stone-500">No restaurants available.</p>';
    return;
  }

  restaurants.forEach(r => {
    grid.innerHTML += `
      <div class="bg-white rounded-2xl border border-stone-200 p-4 space-y-2 shadow-sm">
        <div class="h-32 bg-stone-100 rounded-xl overflow-hidden">
          <img src="${r.cover || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'}" class="w-full h-full object-cover">
        </div>
        <span class="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">${r.cuisine || 'Dining'}</span>
        <h3 class="font-bold text-stone-900 text-sm">${r.name}</h3>
        <p class="text-[11px] text-stone-500">?? ${r.address || r.city}</p>
      </div>
    `;
  });
}
