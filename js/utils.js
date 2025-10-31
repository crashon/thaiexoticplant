/**
 * Utility functions for Thai Exotic Plants
 * Provides common security and helper functions
 */

/**
 * Escape HTML special characters to prevent XSS attacks
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitize HTML by allowing only safe tags
 * This is a basic implementation - for production use DOMPurify
 * @param {string} html - HTML to sanitize
 * @returns {string} - Sanitized HTML
 */
function sanitizeHtml(html) {
  if (!html) return '';

  // Create a temporary div
  const temp = document.createElement('div');
  temp.textContent = html;
  return temp.innerHTML;
}

/**
 * Create a safe HTML element with escaped content
 * @param {string} tag - HTML tag name
 * @param {string} content - Content to escape and insert
 * @param {object} attributes - Attributes to set
 * @returns {HTMLElement} - Created element
 */
function createSafeElement(tag, content, attributes = {}) {
  const element = document.createElement(tag);
  element.textContent = content; // textContent automatically escapes

  for (const [key, value] of Object.entries(attributes)) {
    // Don't set dangerous attributes
    if (['onclick', 'onload', 'onerror'].includes(key.toLowerCase())) {
      console.warn(`Skipping dangerous attribute: ${key}`);
      continue;
    }
    element.setAttribute(key, value);
  }

  return element;
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Format currency (Thai Baht)
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB'
  }).format(amount);
}

/**
 * Format date
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date
 */
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} - Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Show notification message
 * @param {string} message - Message to show
 * @param {string} type - Type: 'success', 'error', 'warning', 'info'
 */
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
    type === 'success' ? 'bg-green-500' :
    type === 'error' ? 'bg-red-500' :
    type === 'warning' ? 'bg-yellow-500' :
    'bg-blue-500'
  } text-white`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Export functions if using modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    escapeHtml,
    sanitizeHtml,
    createSafeElement,
    isValidEmail,
    formatCurrency,
    formatDate,
    debounce,
    showNotification
  };
}
