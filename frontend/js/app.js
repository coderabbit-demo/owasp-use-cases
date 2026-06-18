/**
 * Main Application JavaScript
 * Handles frontend interactions and API calls
 */

const API_BASE = window.location.origin + '/api';

// Initialize app on page load
document.addEventListener('DOMContentLoaded', async () => {
  await loadStatistics();
});

/**
 * Load statistics
 */
async function loadStatistics() {
  try {
    const response = await fetch(`${API_BASE}/examples/stats`);
    const data = await response.json();

    const totalEl = document.getElementById('totalExamples');
    if (totalEl && data.stats) {
      totalEl.textContent = data.stats.total_examples || '12';
    }
  } catch (error) {
    console.error('Failed to load statistics:', error);
  }
}

/**
 * Navigate to example page
 */
function viewExample(exampleId) {
  window.location.href = `/pages/vulnerability.html?id=${exampleId}`;
}

/**
 * Helper: Display error message
 */
function showError(message) {
  alert(`Error: ${message}`);
}

/**
 * Helper: Format date
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

/**
 * Helper: Escape HTML to prevent XSS
 */
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Helper: Copy text to clipboard
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showNotification('Copied to clipboard!', 'success');
  } catch (error) {
    console.error('Failed to copy:', error);
    showNotification('Failed to copy', 'error');
  }
}

/**
 * Helper: Show notification
 */
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 ${
    type === 'success' ? 'bg-green-600' :
    type === 'error' ? 'bg-red-600' :
    'bg-blue-600'
  }`;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}
