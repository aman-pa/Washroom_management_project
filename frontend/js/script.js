document.addEventListener('DOMContentLoaded', () => {
  // Theme Toggle Injection
  const savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
  }

  const navContainer = document.querySelector('.nav-container');
  if (navContainer) {
    const themeBtn = document.createElement('button');
    themeBtn.className = 'btn btn-outline theme-toggle-btn';
    themeBtn.style.cssText = 'border-radius: 50%; width: 40px; height: 40px; padding: 0; display: inline-flex; align-items: center; justify-content: center; font-size: 1.1rem; transition: transform 0.3s ease;';
    
    const sunIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    const moonIconHTML = '<i class="fa-solid fa-moon"></i>';

    // Set correct icon based on current theme
    // Light mode = moon icon (click to go dark), Dark mode = sun icon (click to go light)
    const isDarkNow = document.body.classList.contains('dark-theme');
    themeBtn.innerHTML = isDarkNow ? sunIconSVG : moonIconHTML;
    themeBtn.title = isDarkNow ? "Switch to Light Mode" : "Switch to Dark Mode";
    
    themeBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-theme');
      const isDark = document.body.classList.contains('dark-theme');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      // Update icon and title
      themeBtn.innerHTML = isDark ? sunIconSVG : moonIconHTML;
      themeBtn.title = isDark ? "Switch to Light Mode" : "Switch to Dark Mode";
      // Subtle spin animation on toggle
      themeBtn.style.transform = 'rotate(360deg)';
      setTimeout(() => { themeBtn.style.transform = 'rotate(0deg)'; }, 300);
    });

    const navActions = document.querySelector('.nav-actions');
    if (navActions) {
      navActions.prepend(themeBtn);
    } else {
      navContainer.appendChild(themeBtn);
    }
  }

  // Mobile Nav Toggle
  const mobileBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');

  if(mobileBtn && navLinks) {
    mobileBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }

  // Active Link Highlighting
  const currentLocation = location.pathname.split('/').pop() || 'index.html';
  const navItems = document.querySelectorAll('.nav-links a');
  
  navItems.forEach(item => {
    if(item.getAttribute('href') === currentLocation) {
      item.classList.add('active');
    }
  });

  // Report Issue Form Mock Submission removed. Handled by report.js.

  // FAQ Accordion
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const isActive = item.classList.contains('active');
      
      // Close all others
      document.querySelectorAll('.accordion-item').forEach(i => {
        i.classList.remove('active');
      });

      if(!isActive) {
        item.classList.add('active');
      }
    });
  });

  // Admin Mark Resolved Simulation
  const resolveBtns = document.querySelectorAll('.resolve-btn');
  resolveBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const row = e.target.closest('tr');
      const statusBadge = row.querySelector('.badge');
      statusBadge.className = 'badge badge-success';
      statusBadge.textContent = 'Resolved';
      btn.style.display = 'none';
    });
  });

});
