/**
 * SanitizeQ - API Integration
 * Replaces previous localStorage manager with robust fetch calls to Node.js backend
 */

// Auto-detect API base: works on both localhost and deployed server
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : `${window.location.origin}/api`;

// Utility to get auth token
function getAuthToken() {
  return localStorage.getItem('sq_auth_token');
}

// Utility API Call wrapper
async function apiCall(endpoint, method = 'GET', body = null) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API Request Failed');
  }
  return data;
}

// API Methods
async function fetchWashrooms() {
  return await apiCall('/washrooms');
}

async function fetchComplaints() {
  return await apiCall('/complaints');
}

async function fetchStaff() {
  return await apiCall('/staff/list');
}

async function fetchActivityLogs() {
  return await apiCall('/activity');
}

async function updateWashroomStatus(idString, status) {
  return await apiCall(`/washrooms/${idString}`, 'PUT', { status });
}

async function resetAllWashrooms() {
  return await apiCall('/washrooms/reset/all', 'PUT');
}

async function assignStaffToWashroom(staffName, wingName) {
  // We fetch washrooms, find matching wing, and update them globally
  const washrooms = await fetchWashrooms();
  const targetWashrooms = washrooms.filter(w => w.location.includes(wingName));

  let promises = targetWashrooms.map(w =>
    apiCall(`/washrooms/${w.idString}`, 'PUT', { assignedStaff: staffName })
  );

  return await Promise.all(promises);
}

async function resolveComplaint(compId) {
  return await apiCall(`/complaints/${encodeURIComponent(compId)}`, 'PUT', { status: 'Resolved' });
}

async function assignComplaint(compId, statusText) {
  return await apiCall(`/complaints/${encodeURIComponent(compId)}`, 'PUT', { status: statusText });
}

async function reportNewIssue(washroomId, issueDesc, reporterName) {
  return await apiCall('/complaints', 'POST', { washroomId, issueType: issueDesc, reporterName });
}

async function markWashroomCleanStaff(idString) {
  return await apiCall(`/staff/clean/${idString}`, 'PUT');
}

async function submitContactMessage(messageData) {
  // Public endpoint, so apiCall won't break if no token
  return await apiCall('/messages', 'POST', messageData);
}

async function fetchContactMessages() {
  return await apiCall('/messages');
}

function getUserMetadata() {
  return JSON.parse(localStorage.getItem('sq_user_meta') || '{}');
}

function guardPageRole(requiredRole) {
  const user = getUserMetadata();
  const token = getAuthToken();
  if (!token || user.role !== requiredRole) {
    alert(`Access Denied! You must be a ${requiredRole} to view this page.`);
    window.location.href = 'login.html';
  }
}
