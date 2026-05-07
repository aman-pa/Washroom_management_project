document.addEventListener('DOMContentLoaded', () => {
  guardPageRole('staff');
  const contextSelect = document.getElementById('staff-context');
  
  // Try to use true logged in user name when on the staff board
  let me = getUserMetadata();
  if(me && me.name) {
    contextSelect.value = me.name;
    // Hide context switch if we are a real user
    contextSelect.style.display = 'none';
    let label = document.createElement('span');
    label.style.marginRight = '15px';
    label.style.fontWeight = '500';
    label.innerText = `Logged in as: ${me.name}`;
    contextSelect.parentNode.insertBefore(label, contextSelect);
  }

  // Initial Render
  renderStaffDashboard(contextSelect.value);

  // Switch context (for manual demo mode if needed)
  contextSelect.addEventListener('change', (e) => {
    renderStaffDashboard(e.target.value);
  });

  // Handle Report Form
  document.getElementById('staff-report-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const washroomId = document.getElementById('report-washroom-id').value;
    const desc = document.getElementById('report-issue-desc').value;
    if(!washroomId) {
      alert("No washroom selected.");
      return;
    }
    try {
      await reportNewIssue(washroomId, desc);
      alert(`Report submitted for ${washroomId}.`);
      e.target.reset(); // clear form
      renderStaffDashboard(contextSelect.value); // refresh
    } catch (err) {
      alert('Error creating report');
    }
  });
});

async function renderStaffDashboard(currentStaffName) {
  try {
    const washrooms = await fetchWashrooms();
    const activities = await fetchActivityLogs();
    const complaints = await fetchComplaints();
    
    // Get washrooms assigned to this specific simulated staff logged in
    const myWashrooms = washrooms.filter(w => w.assignedStaff === currentStaffName);

    // Render Table
    const taskBody = document.getElementById('staff-task-body');
    const reportSelect = document.getElementById('report-washroom-id');
    taskBody.innerHTML = '';
    reportSelect.innerHTML = '';

    myWashrooms.forEach(w => {
      let badgeClass = w.status === 'Clean' ? 'badge-success' : (w.status === 'Dirty' ? 'badge-danger' : 'badge-warning');
      let actionBtn = '';
      
      if (w.status === 'Clean') {
        actionBtn = `<span style="color: var(--light-text); font-size: 0.9rem;"><i class="fa-solid fa-check"></i> Cleaned</span>`;
      } else {
        actionBtn = `<button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.85rem;" onclick="handleMarkClean('${w.idString}', '${currentStaffName}')"><i class="fa-solid fa-broom"></i> Mark Cleaned</button>`;
      }

      taskBody.innerHTML += `
        <tr>
          <td style="font-weight:500;">${w.idString}</td>
          <td>${w.location}</td>
          <td><span class="badge ${badgeClass}">${w.status}</span></td>
          <td>${w.lastCleanedTime}</td>
          <td>${actionBtn}</td>
        </tr>
      `;

      // Populate report dropdown
      reportSelect.innerHTML += `<option value="${w.idString}">${w.location} (${w.idString})</option>`;
    });

    if (myWashrooms.length === 0) {
      taskBody.innerHTML = `<tr><td colspan="5" class="text-center" style="color:var(--light-text); padding:20px;">No areas assigned to you currently.</td></tr>`;
      reportSelect.innerHTML = `<option value="" disabled selected>No areas assigned</option>`;
    }

    // Render Complaints
    const compBody = document.getElementById('staff-complaint-body');
    if (compBody) {
      const myComplaints = complaints.filter(c => c.status.includes(currentStaffName));
      compBody.innerHTML = '';
      myComplaints.forEach(c => {
        let badgeClass = c.status === 'Resolved' ? 'badge-success' : 'badge-warning';
        let actionBtn = '';
        if (c.status !== 'Resolved') {
          actionBtn = `<button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.85rem;" onclick="handleResolveComplaint('${c._id}', '${currentStaffName}')"><i class="fa-solid fa-check"></i> Mark Complete</button>`;
        } else {
          actionBtn = `<span style="color: var(--light-text); font-size: 0.9rem;"><i class="fa-solid fa-check-double"></i> Completed</span>`;
        }

        compBody.innerHTML += `
          <tr>
            <td>${c.idString}</td>
            <td style="font-weight: 500;">${c.washroomId}</td>
            <td>${c.issueType}</td>
            <td><span class="badge ${badgeClass}">${c.status}</span></td>
            <td>${actionBtn}</td>
          </tr>
        `;
      });
      if (myComplaints.length === 0) {
        compBody.innerHTML = `<tr><td colspan="4" class="text-center" style="color:var(--light-text); padding:20px;">No complaints assigned directly to you.</td></tr>`;
      }
    }

    // Render Activity (Show only logs related to this staff member)
    const logList = document.getElementById('staff-history-list');
    logList.innerHTML = '';
    
    const myActivities = activities.filter(log => log.message.includes(currentStaffName));

    myActivities.forEach(log => {
      logList.innerHTML += `<li style="padding: 10px; border-bottom: 1px solid var(--border-color); font-size: 0.9rem;">
        <span style="color: var(--light-text); margin-right: 10px;">[${log.time}]</span> ${log.message}
      </li>`;
    });

    if (myActivities.length === 0) {
      logList.innerHTML = `<li style="color:var(--light-text); padding:10px;">No recent activity.</li>`;
    }
  } catch(error) {
    console.error(error);
  }
}

// Global hook for onclick
window.handleMarkClean = async function(washroomId, staffName) {
  try {
    await markWashroomCleanStaff(washroomId);
    renderStaffDashboard(staffName);
  } catch(e) {
    alert("Error updating status to server.");
  }
}

window.handleResolveComplaint = async function(compId, staffName) {
  try {
    await resolveComplaint(compId);
    renderStaffDashboard(staffName);
  } catch(e) {
    alert("Error updating complaint status.");
  }
}
