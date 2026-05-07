document.addEventListener('DOMContentLoaded', () => {
  const contactForm = document.getElementById('contact-form');
  
  if(contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      const messageData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        subject: document.getElementById('subject').value,
        content: document.getElementById('message').value
      };

      try {
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
        submitBtn.disabled = true;

        if (typeof submitContactMessage === 'function') {
          const res = await submitContactMessage(messageData);
          if(res.success) {
            contactForm.innerHTML = `
              <div class="text-center" style="padding: 30px 0;">
                <i class="fa-solid fa-circle-check" style="font-size: 3rem; color: var(--secondary-color); margin-bottom: 20px;"></i>
                <h4>Message Sent!</h4>
                <p style="color: var(--light-text); margin-top: 10px;">Thank you for contacting us. Our admin team will get back to you shortly.</p>
              </div>
            `;
          } else {
            throw new Error(res.error || "Failed to send");
          }
        } else {
          throw new Error("API integration missing");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to send message: " + err.message);
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }
});
