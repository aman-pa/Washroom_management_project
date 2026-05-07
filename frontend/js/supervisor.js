document.addEventListener('DOMContentLoaded', () => {
  guardPageRole('supervisor');
  renderSupervisorDashboard();

  // Bind Staff Shift Assignment Form
  document.getElementById('sup-assign-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const staff = document.getElementById('sup-assign-staff-select').value;
    const loc = document.getElementById('sup-assign-loc-select').value;
    try {
      await assignStaffToWashroom(staff, loc);
      alert(`${staff} successfully assigned to ${loc}.`);
      renderSupervisorDashboard(); // Refresh panels
    } catch (err) {
      alert("Assignment failed: " + err.message);
    }
  });

  // Bind Reset Day Button
  document.getElementById('sup-reset-day-btn').addEventListener('click', async () => {
    if(confirm("Are you sure you want to reset all washrooms to DIRTY? This starts a new shift cycle.")) {
      try {
        await resetAllWashrooms();
        alert("All washrooms have been reset to Dirty for the new day.");
        renderSupervisorDashboard();
      } catch (err) {
        alert("Failed to reset: " + err.message);
      }
    }
  });
});

async function renderSupervisorDashboard() {
  try {
    const washrooms = await fetchWashrooms();
    const complaints = await fetchComplaints();
    const staffArray = await fetchStaff();
    
    // High level tasks (Washrooms assigned to someone but not clean)
    const pendingTasks = washrooms.filter(w => w.status !== 'Clean');
    const completedTasks = washrooms.filter(w => w.status === 'Clean');
    const activeComplaints = complaints.filter(c => c.status !== 'Resolved');

    // Stats
    document.getElementById('sup-stat-pending').textContent = pendingTasks.length;
    document.getElementById('sup-stat-completed').textContent = completedTasks.length;
    document.getElementById('sup-stat-complaints').textContent = activeComplaints.length;

    // Populate Staff Dropdown
    const staffSelect = document.getElementById('sup-assign-staff-select');
    if (staffSelect) {
      staffSelect.innerHTML = '';
      staffArray.forEach(s => {
        staffSelect.innerHTML += `<option value="${s.name}">${s.name}</option>`;
      });
    }

    // Task Monitoring Table
    const taskBody = document.getElementById('sup-task-body');
    taskBody.innerHTML = '';
    
    washrooms.forEach(w => {
      if (w.assignedStaff === 'Unassigned' && w.status === 'Clean') return; // Skip completely clean & unassigned

      let badgeClass = w.status === 'Clean' ? 'badge-success' : (w.status === 'Dirty' ? 'badge-danger' : 'badge-warning');
      let actionBtn = w.status !== 'Clean' ? 
        `<button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.8rem;" onclick="pingStaff('${w.assignedStaff}')">Ping Staff</button>` :
        `<span style="color: var(--secondary-color); font-size: 0.9rem;"><i class="fa-solid fa-check-double"></i> Verified Clean</span>`;

      taskBody.innerHTML += `
        <tr>
          <td style="font-weight:500;">${w.assignedStaff}</td>
          <td>${w.location} (ID: ${w.idString})</td>
          <td><span class="badge ${badgeClass}">${w.status}</span></td>
          <td>${actionBtn}</td>
        </tr>
      `;
    });

    // Complaint Reassignment Table
    const compBody = document.getElementById('sup-comp-body');
    compBody.innerHTML = '';
    
    activeComplaints.forEach(c => {
      let badgeClass = c.status.includes('Pending') ? 'badge-danger' : 'badge-warning';
      
      compBody.innerHTML += `
        <tr>
          <td><strong>${c.idString}</strong><br><span style="font-size:0.85rem; color:var(--light-text);">${c.issueType}</span></td>
          <td>${c.washroomId}</td>
          <td><span class="badge ${badgeClass}">${c.status}</span></td>
          <td>
            <div style="display:flex; gap:10px;">
              <select class="form-control" style="padding: 6px; font-size: 0.85rem;" id="assign-${c._id}">
                <option value="" disabled selected>Select Janitor Team</option>
                <option value="Janitor Team A">Janitor Team A</option>
                <option value="Janitor Team B">Janitor Team B</option>
              </select>
              <button onclick="handleAssignComplaint('${c._id}')" class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.85rem;">Assign</button>
            </div>
          </td>
        </tr>
      `;
    });

    if (activeComplaints.length === 0) {
      compBody.innerHTML = `<tr><td colspan="4" class="text-center" style="color:var(--light-text); padding:20px;">No active complaints. Excellent!</td></tr>`;
    }
  } catch (error) {
    console.error(error);
  }
}

// Global Actions
window.pingStaff = function(staffName) {
  if(staffName === 'Unassigned') {
    alert('Cannot ping. This washroom is Unassigned.');
    return;
  }
  alert(`Alert sent to ${staffName}'s device regarding pending task.`);
}

window.handleAssignComplaint = async function(compId) {
  const selectNode = document.getElementById(`assign-${compId}`);
  const staffName = selectNode.value;
  
  if (!staffName) {
    alert("Please select a Janitor Team first before clicking Assign.");
    return;
  }
  
  try {
    await assignComplaint(compId, `Assigned to ${staffName}`);
    renderSupervisorDashboard();
  } catch(e) {
    console.error("Assignment Error:", e);
    alert("Assignment failed!");
  }
}

