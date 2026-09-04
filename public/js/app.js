let map;
let markersGroup;

document.addEventListener('DOMContentLoaded', () => {
  initMap();
  fetchRestaurants();
});

function initMap() {
  const mapElement = document.getElementById('map');
  if (!mapElement) return;

  // Default centered at Ahmedabad coordinates
  map = L.map('map').setView([23.0225, 72.5714], 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map);

  markersGroup = L.layerGroup().addTo(map);
}

async function fetchRestaurants() {
  try {
    const res = await fetch('/api/restaurants');
    const data = await res.json();
    renderRestaurants(data);
    renderMapMarkers(data);
  } catch (err) {
    console.error("Error loading restaurants:", err);
  }
}

function renderMapMarkers(restaurants) {
  if (!map || !markersGroup) return;
  markersGroup.clearLayers();

  const validBounds = [];

  restaurants.forEach(resto => {
    const lat = parseFloat(resto.lat);
    const lng = parseFloat(resto.lng);

    // Guard against NaN or missing coordinates
    if (!isNaN(lat) && !isNaN(lng)) {
      const marker = L.marker([lat, lng])
        .bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px;">
            <b style="font-size: 14px; color: #1c1917;">${resto.name}</b><br>
            <span style="color: #ea580c; font-weight: bold;">${resto.cuisine || 'Restaurant'}</span><br>
            <span style="color: #6b7280;">?? ${resto.address || ''}</span>
          </div>
        `);
      markersGroup.addLayer(marker);
      validBounds.push([lat, lng]);
    }
  });

  if (validBounds.length > 0) {
    map.fitBounds(validBounds, { padding: [30, 30], maxZoom: 14 });
  }
}

function renderRestaurants(restaurants) {
  const grid = document.getElementById('restaurant-grid');
  if (!grid) return;
  grid.innerHTML = '';

  if (!restaurants || restaurants.length === 0) {
    grid.innerHTML = `<p class="text-stone-500 text-sm">No approved restaurants yet.</p>`;
    return;
  }

  restaurants.forEach(resto => {
    grid.innerHTML += `
      <div class="bg-white rounded-3xl border border-stone-200/80 overflow-hidden hover:shadow-xl transition duration-300">
        <div class="h-48 bg-stone-200 relative">
          <img src="${resto.cover || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'}" class="w-full h-full object-cover" alt="${resto.name}">
          <span class="absolute top-3 right-3 bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg">? ${resto.rating || '5.0'}</span>
        </div>
        <div class="p-5 space-y-2">
          <span class="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">${resto.cuisine || 'General'}</span>
          <h3 class="font-extrabold text-stone-900 text-lg">${resto.name}</h3>
          <p class="text-xs text-stone-500">?? ${resto.address}, ${resto.city}</p>
          <button class="w-full mt-3 zomato-gradient text-white font-bold py-2.5 rounded-xl text-xs shadow-md hover:opacity-90 transition">Pre-Order & Reserve</button>
        </div>
      </div>
    `;
  });
}
