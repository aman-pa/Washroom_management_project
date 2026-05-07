document.addEventListener('DOMContentLoaded', async () => {
  const reportForm = document.getElementById('report-form');
  const successMessage = document.getElementById('success-message');
  const washroomSelect = document.getElementById('washroom-id');
  const submitBtn = reportForm ? reportForm.querySelector('button[type="submit"]') : null;

  // Load locations dynamically from backend
  try {
    if (washroomSelect && typeof fetchWashrooms === 'function') {
      const washrooms = await fetchWashrooms();
      
      // Clear out the hardcoded options except the first placeholder!
      washroomSelect.innerHTML = '<option value="">Select a location</option>';
      
      washrooms.forEach(w => {
        const opt = document.createElement('option');
        opt.value = w.idString;
        opt.textContent = `${w.location} - Room ${w.idString}`;
        washroomSelect.appendChild(opt);
      });
    }
  } catch(e) {
    console.error("Failed to load washrooms for select menu:", e);
  }

  // Handle Form Submission
  if(reportForm && successMessage) {
    reportForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const washroomId = document.getElementById('washroom-id').value;
      const reporterName = document.getElementById('reporter-name').value.trim();
      const issueTypeElement = document.getElementById('issue-type');
      let issueDesc = issueTypeElement.options[issueTypeElement.selectedIndex].text;
      const additionalDetails = document.getElementById('description').value;
      
      if(additionalDetails && additionalDetails.trim() !== '') {
        issueDesc += ` - ${additionalDetails.trim()}`;
      }

      // Add loading state
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right: 8px;"></i> Submitting...';
      submitBtn.disabled = true;

      try {
        if (typeof reportNewIssue === 'function') {
          await reportNewIssue(washroomId, issueDesc, reporterName);
          
          reportForm.style.display = 'none';
          successMessage.classList.remove('d-none');
        } else {
          throw new Error("API method reportNewIssue not found.");
        }
      } catch(err) {
        console.error(err);
        alert('Failed to submit report. Please try again or contact administration directly.');
        
        // Revert button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }
});
