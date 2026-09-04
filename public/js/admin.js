document.addEventListener('DOMContentLoaded', () => {
  loadPendingRequests();
  loadCustomers();
});

async function loadPendingRequests() {
  const res = await fetch('/api/admin/pending');
  const requests = await res.json();
  const container = document.getElementById('pending-list');
  const countBadge = document.getElementById('pending-count');
  
  if (countBadge) countBadge.innerText = requests.length;
  if (!container) return;

  container.innerHTML = '';
  if (requests.length === 0) {
    container.innerHTML = `<tr class="border-b"><td colspan="5" class="p-4 text-center text-stone-400 text-xs">No pending registration requests.</td></tr>`;
    return;
  }

  requests.forEach(req => {
    container.innerHTML += `
      <tr class="border-b hover:bg-stone-50 text-xs">
        <td class="p-4 font-bold text-stone-900">${req.name}</td>
        <td class="p-4">${req.city} • <span class="text-stone-500">${req.cuisine}</span></td>
        <td class="p-4 text-stone-600">${req.ownerEmail}</td>
        <td class="p-4"><span class="bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full text-[10px]">Pending Approval</span></td>
        <td class="p-4 space-x-2">
          <button onclick="approveRestaurant(${req.id})" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] shadow-sm">Approve</button>
          <button onclick="rejectRestaurant(${req.id})" class="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] shadow-sm">Reject</button>
        </td>
      </tr>
    `;
  });
}

async function approveRestaurant(id) {
  const res = await fetch(`/api/admin/approve/${id}`, { method: 'POST' });
  const data = await res.json();
  alert(data.message);
  loadPendingRequests();
}

async function rejectRestaurant(id) {
  const res = await fetch(`/api/admin/reject/${id}`, { method: 'POST' });
  const data = await res.json();
  alert(data.message);
  loadPendingRequests();
}

async function loadCustomers() {
  const res = await fetch('/api/admin/customers');
  const customers = await res.json();
  const container = document.getElementById('customer-list');
  if (!container) return;

  container.innerHTML = '';
  customers.forEach(c => {
    container.innerHTML += `
      <tr class="border-b hover:bg-stone-50 text-xs">
        <td class="p-4 font-bold text-stone-900">${c.name}</td>
        <td class="p-4 text-stone-600">${c.email}</td>
        <td class="p-4"><span class="bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-md">Lvl ${c.level}</span></td>
        <td class="p-4 font-semibold">${c.bookings} Bookings</td>
        <td class="p-4"><span class="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full text-[10px]">${c.status}</span></td>
      </tr>
    `;
  });
}
