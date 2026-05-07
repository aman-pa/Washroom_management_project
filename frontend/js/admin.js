document.addEventListener('DOMContentLoaded', () => {
  guardPageRole('admin');
  renderAdminDashboard();
});

async function renderAdminDashboard() {
  try {
    const washrooms = await fetchWashrooms();
    const complaints = await fetchComplaints();
    const activities = await fetchActivityLogs();
    
    // Attempt to fetch messages if admin
    let messages = [];
    try {
      if (typeof fetchContactMessages === 'function') {
        messages = await fetchContactMessages();
      }
    } catch(e) {
      console.warn("Could not fetch messages", e);
    }

    // Metrics
    document.getElementById('stat-total').textContent = washrooms.length;
    let cleanCount = washrooms.filter(w => w.status === 'Clean').length;
    document.getElementById('stat-clean').textContent = cleanCount;
    document.getElementById('stat-dirty').textContent = washrooms.length - cleanCount;

    // Washrooms Table
    const washBody = document.getElementById('washroom-table-body');
    washBody.innerHTML = '';
    washrooms.forEach(w => {
      let badgeClass = w.status === 'Clean' ? 'badge-success' : (w.status === 'Dirty' ? 'badge-danger' : 'badge-warning');
      washBody.innerHTML += `
        <tr>
          <td>${w.idString}</td>
          <td style="font-weight:500;">${w.location}</td>
          <td><span class="badge ${badgeClass}">${w.status}</span></td>
          <td>${w.lastCleanedTime}</td>
          <td>${w.assignedStaff}</td>
        </tr>
      `;
    });

    // Complaints Table
    const compBody = document.getElementById('complaint-table-body');
    compBody.innerHTML = '';
    complaints.forEach(c => {
      let badgeClass = c.status === 'Resolved' ? 'badge-success' : (c.status.includes('Pending') ? 'badge-danger' : 'badge-warning');
      let actionHtml = '';
      if(c.status !== 'Resolved') {
        actionHtml = `<span style="color: var(--warning-color);"><i class="fa-solid fa-hourglass-half"></i> In Progress</span>`;
      } else {
        actionHtml = `<span style="color: var(--light-text);"><i class="fa-solid fa-check"></i> Resolved</span>`;
      }
      compBody.innerHTML += `
        <tr>
          <td>${c.idString}</td>
          <td style="font-weight: 500;">${c.washroomId}</td>
          <td>${c.issueType}</td>
          <td>${c.createdAt}</td>
          <td><span class="badge ${badgeClass}">${c.status}</span></td>
          <td>${actionHtml}</td>
        </tr>
      `;
    });

    // Inbox Table
    const inboxBody = document.getElementById('inbox-table-body');
    if (inboxBody) {
      inboxBody.innerHTML = '';
      if (messages.length === 0) {
        inboxBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--light-text);">No messages found.</td></tr>';
      } else {
        messages.forEach(m => {
          inboxBody.innerHTML += `
            <tr>
              <td style="white-space: nowrap;">${m.createdAt}</td>
              <td style="font-weight: 500;">${m.name}</td>
              <td><a href="mailto:${m.email}" style="color: var(--primary-color);">${m.email}</a></td>
              <td style="font-weight: 500;">${m.subject}</td>
              <td><div class="msg-preview">${m.content}</div></td>
            </tr>
          `;
        });
      }
    }

    // Staff Shift Overview (Read-Only)
    const shiftBody = document.getElementById('admin-shift-overview-body');
    if (shiftBody) {
      shiftBody.innerHTML = '';
      // Group washrooms by assigned staff
      const staffMap = {};
      washrooms.forEach(w => {
        const staff = w.assignedStaff || 'Unassigned';
        if (!staffMap[staff]) {
          staffMap[staff] = { locations: new Set(), count: 0 };
        }
        staffMap[staff].locations.add(w.location.split(' - ')[0]); // Wing name
        staffMap[staff].count++;
      });

      const staffEntries = Object.entries(staffMap);
      if (staffEntries.length === 0) {
        shiftBody.innerHTML = '<tr><td colspan="3" style="text-align:center; color: var(--light-text);">No shift data available.</td></tr>';
      } else {
        staffEntries.forEach(([name, data]) => {
          const isUnassigned = name === 'Unassigned';
          shiftBody.innerHTML += `
            <tr style="${isUnassigned ? 'opacity: 0.5;' : ''}">
              <td style="font-weight: 500;">${name}</td>
              <td>${[...data.locations].join(', ')}</td>
              <td>${data.count} washroom${data.count > 1 ? 's' : ''}</td>
            </tr>
          `;
        });
      }
    }

    // Activity Log
    const logList = document.getElementById('activity-log-list');
    logList.innerHTML = '';
    activities.forEach(log => {
      logList.innerHTML += `<li style="padding: 12px 10px; border-bottom: 1px solid var(--border-color); font-size: 0.92rem;">
        <span style="color: var(--light-text); font-weight: 500; margin-right: 10px;">[${log.time}]</span> ${log.message}
      </li>`;
    });
  } catch (error) {
    console.error("Dashboard Render Error:", error);
  }
}

// Global scope for onclick handlers in dynamically generated HTML
// (Removed global handleResolve since we use event delegation now)

