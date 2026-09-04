document.addEventListener('DOMContentLoaded', () => {
  fetchRestaurants();
});

async function fetchRestaurants() {
  try {
    const res = await fetch('/api/restaurants');
    const data = await res.json();
    renderRestaurants(data);
  } catch (err) {
    console.error("Error fetching restaurants:", err);
  }
}

function renderRestaurants(restaurants) {
  const grid = document.getElementById('restaurant-grid');
  if (!grid) return;
  grid.innerHTML = '';

  restaurants.forEach(resto => {
    grid.innerHTML += `
      <div class="bg-white rounded-3xl border border-stone-200/80 overflow-hidden hover:shadow-xl transition duration-300">
        <div class="h-48 bg-stone-200 relative">
          <img src="${resto.cover || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'}" class="w-full h-full object-cover">
          <span class="absolute top-3 right-3 bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg">? ${resto.rating || '5.0'}</span>
        </div>
        <div class="p-5 space-y-2">
          <span class="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">${resto.cuisine}</span>
          <h3 class="font-extrabold text-stone-900 text-lg">${resto.name}</h3>
          <p class="text-xs text-stone-500">?? ${resto.address}, ${resto.city}</p>
          <button class="w-full mt-3 zomato-gradient text-white font-bold py-2.5 rounded-xl text-xs shadow-md">Pre-Order & Reserve</button>
        </div>
      </div>
    `;
  });
}
