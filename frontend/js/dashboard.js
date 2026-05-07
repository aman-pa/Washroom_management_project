document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('washroom-grid');
  const statTotal = document.getElementById('stat-total');
  const statClean = document.getElementById('stat-clean');
  const statAttention = document.getElementById('stat-attention');
  const navCount = document.getElementById('nav-washroom-count');
  const locationFilter = document.getElementById('location-filter');

  let allWashrooms = [];

  // Function to render the dashboard
  function renderDashboard(washroomsToRender) {
    // 1. Update stats
    const total = washroomsToRender.length;
    let clean = 0;
    let attention = 0;

    washroomsToRender.forEach(w => {
      if (w.status === 'Clean') clean++;
      else attention++;
    });

    if (statTotal) statTotal.textContent = total;
    if (statClean) statClean.textContent = clean;
    if (statAttention) statAttention.textContent = attention;
    if (navCount) navCount.textContent = total;

    // 2. Render Grid
    if (!grid) return;
    grid.innerHTML = '';
    
    if (washroomsToRender.length === 0) {
      grid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--light-text); padding: 40px;">No washrooms found for this selection.</p>';
      return;
    }

    washroomsToRender.forEach(w => {
      const card = document.createElement('div');
      card.className = 'card washroom-card';

      let badgeClass = 'badge-success';
      let statusColor = 'var(--secondary-color)';
      let borderStyle = '';

      if (w.status === 'Dirty') {
        badgeClass = 'badge-danger';
        statusColor = 'var(--danger-color)';
        borderStyle = 'border-color: var(--danger-color); box-shadow: 0 0 10px rgba(239,68,68,0.2);';
      } else if (w.status === 'Maintenance') {
        badgeClass = 'badge-warning';
        statusColor = 'var(--accent-color)';
        borderStyle = 'border-color: var(--accent-color);';
      }

      if (borderStyle) card.style.cssText = borderStyle;

      // Extract location code (e.g., N-101) from idString
      const title = w.idString;

      card.innerHTML = `
        <div class="washroom-header">
          <h4>${title}</h4>
          <span class="badge ${badgeClass}">${w.status}</span>
        </div>
        <div class="status-row">
          <span style="color: var(--light-text);"><i class="fa-solid fa-map-location-dot"></i> Wing</span>
          <span style="font-weight: 500;">${w.location}</span>
        </div>
        <div class="status-row">
          <span style="color: var(--light-text);"><i class="fa-regular fa-clock"></i> Last Cleaned</span>
          <span style="font-weight: 500;">${w.lastCleanedTime || 'Never'}</span>
        </div>
        <div class="status-row">
          <span style="color: var(--light-text);"><i class="fa-solid fa-user-nurse"></i> Assigned Staff</span>
          <span style="font-weight: 600;">${w.assignedStaff || 'Unassigned'}</span>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  // Load backend data
  try {
    if (grid) grid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--light-text); padding: 40px;"><i class="fa-solid fa-spinner fa-spin"></i> Loading live data...</p>';
    
    if (typeof fetchWashrooms === 'function') {
      allWashrooms = await fetchWashrooms();
    } else {
      console.warn("fetchWashrooms not found. Ensure app.js is loaded.");
      allWashrooms = [];
    }
    
    renderDashboard(allWashrooms);

  } catch (err) {
    console.error('Failed to load washrooms:', err);
    if (grid) {
      grid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--danger-color); padding: 40px;"><i class="fa-solid fa-triangle-exclamation"></i> Failed to pull live data from the server. Is the backend running?</p>';
    }
  }

  // Filter listener
  if (locationFilter) {
    locationFilter.addEventListener('change', (e) => {
      const selected = e.target.value;
      if (selected === 'All Locations') {
        renderDashboard(allWashrooms);
      } else {
        // e.g., Filter by extracting keywords like "North Wing"
        const keyword = selected.split(' (')[0]; // "North Wing"
        const filtered = allWashrooms.filter(w => w.location.includes(keyword) || selected.includes(w.location));
        renderDashboard(filtered);
      }
    });
  }
});
