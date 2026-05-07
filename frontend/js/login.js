/**
 * Login Page Functionality - Integrates with Node Backend API
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const roleInput = document.getElementById('role');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const rememberCheckbox = document.getElementById('remember');
  const loginBtn = document.getElementById('login-btn');
  const togglePasswordBtn = document.getElementById('toggle-password');
  const toggleIcon = document.getElementById('toggle-icon');
  
  const btnText = document.getElementById('btn-text');
  const loginSpinner = document.getElementById('login-spinner');

  const roleError = document.getElementById('role-error');
  const emailError = document.getElementById('email-error');
  const passwordError = document.getElementById('password-error');

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  init();

  function init() {
    loadRememberedEmail();
    setupEventListeners();
    validateForm();
  }

  function setupEventListeners() {
    roleInput.addEventListener('change', validateForm);
    emailInput.addEventListener('input', validateForm);
    passwordInput.addEventListener('input', validateForm);
    togglePasswordBtn.addEventListener('click', togglePassword);
    loginForm.addEventListener('submit', handleLogin);
  }

  function loadRememberedEmail() {
    const savedEmail = localStorage.getItem('sanitizeq_remembered_email');
    if (savedEmail) {
      emailInput.value = savedEmail;
      rememberCheckbox.checked = true;
    }
  }

  function togglePassword() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    if (type === 'text') {
      toggleIcon.classList.remove('fa-eye');
      toggleIcon.classList.add('fa-eye-slash');
    } else {
      toggleIcon.classList.remove('fa-eye-slash');
      toggleIcon.classList.add('fa-eye');
    }
  }

  function validateForm() {
    clearErrors();
    let isValid = true;
    if (!roleInput.value) isValid = false;
    if (emailInput.value.trim() === '') isValid = false;
    if (passwordInput.value.trim() === '') isValid = false;
    loginBtn.disabled = !isValid;
    return isValid;
  }

  function validateOnSubmit() {
    clearErrors();
    let hasError = false;

    if (!roleInput.value) {
      showError(roleInput, roleError, 'Please select a role.');
      hasError = true;
    }

    if (emailInput.value.trim() === '') {
      showError(emailInput, emailError, 'Email or Employee ID is required.');
      hasError = true;
    } else if (!emailPattern.test(emailInput.value.trim())) {
      showError(emailInput, emailError, 'Please enter a valid email address.');
      hasError = true;
    }

    if (passwordInput.value.trim() === '') {
      showError(passwordInput, passwordError, 'Password is required.');
      hasError = true;
    }

    return !hasError;
  }

  function showError(inputElement, errorElement, message) {
    inputElement.classList.add('is-invalid');
    errorElement.textContent = message;
  }

  function clearErrors() {
    const inputs = [roleInput, emailInput, passwordInput];
    const errors = [roleError, emailError, passwordError];
    inputs.forEach(input => input.classList.remove('is-invalid'));
    errors.forEach(error => error.textContent = '');
  }

  async function handleLogin(e) {
    e.preventDefault();
    if (!validateOnSubmit()) return;

    if (rememberCheckbox.checked) {
      localStorage.setItem('sanitizeq_remembered_email', emailInput.value.trim());
    } else {
      localStorage.removeItem('sanitizeq_remembered_email');
    }

    setLoadingState(true);

    try {
      const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000/api' 
        : `${window.location.origin}/api`;

      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput.value.trim().toLowerCase(),
          password: passwordInput.value.trim(),
          role: roleInput.value
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Store Tokens and Meta
      localStorage.setItem('sq_auth_token', data.token);
      localStorage.setItem('sq_user_meta', JSON.stringify(data.user));

      // Redirect
      switch (data.user.role) {
        case 'admin':
          window.location.href = 'admin.html';
          break;
        case 'supervisor':
          window.location.href = 'supervisor.html';
          break;
        case 'staff':
          window.location.href = 'staff.html';
          break;
        default:
          window.location.href = 'index.html';
      }

    } catch (error) {
      setLoadingState(false);
      showError(passwordInput, passwordError, error.message);
    }
  }

  function setLoadingState(isLoading) {
    if (isLoading) {
      loginBtn.disabled = true;
      btnText.textContent = 'Logging in...';
      loginSpinner.classList.remove('d-none');
    } else {
      loginBtn.disabled = false;
      btnText.textContent = 'Log In securely';
      loginSpinner.classList.add('d-none');
    }
  }
});
