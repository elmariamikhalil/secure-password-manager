// Content script for the password manager extension
// This script is injected into web pages to handle form detection and autofill

// Find password and username fields in the page
function findPasswordFields() {
  // Find all password fields
  const passwordFields = Array.from(document.querySelectorAll('input[type="password"]'));
  
  if (passwordFields.length === 0) {
    return { passwordFields: [], usernameFields: [] };
  }
  
  // Find potential username fields (typically appearing before password fields)
  const usernameFields = [];
  
  passwordFields.forEach(passwordField => {
    // Check if the password field is within a form
    const form = passwordField.closest('form');
    if (form) {
      // Get all input fields in the form
      const inputs = Array.from(form.querySelectorAll('input:not([type="password"]):not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"])'));
      
      // Find input fields that come before the password field in the DOM
      const precedingInputs = inputs.filter(input => {
        return input.compareDocumentPosition(passwordField) & Node.DOCUMENT_POSITION_FOLLOWING;
      });
      
      if (precedingInputs.length > 0) {
        // The last input before the password field is most likely the username
        usernameFields.push(precedingInputs[precedingInputs.length - 1]);
      }
    }
  });
  
  return { passwordFields, usernameFields };
}

// Fill form fields and trigger events to notify the website
function fillFormFields(usernameField, passwordField, username, password) {
  if (usernameField && username) {
    usernameField.value = username;
    triggerInputEvents(usernameField);
  }
  
  if (passwordField && password) {
    passwordField.value = password;
    triggerInputEvents(passwordField);
  }
}

// Trigger input events to simulate user typing
function triggerInputEvents(field) {
  // Create and dispatch events
  const events = ['input', 'change', 'blur', 'keydown', 'keyup'];
  
  events.forEach(eventType => {
    const event = new Event(eventType, { bubbles: true });
    field.dispatchEvent(event);
  });
}

// Add SecureVault icon next to form fields
function addVaultIcons() {
  const { passwordFields, usernameFields } = findPasswordFields();
  
  if (passwordFields.length === 0) {
    return;
  }
  
  // Add icon next to username fields
  usernameFields.forEach(field => {
    addIconToField(field, 'username-field');
  });
  
  // Add icon next to password fields
  passwordFields.forEach(field => {
    addIconToField(field, 'password-field');
  });
}

// Add icon next to a specific field
function addIconToField(field, fieldType) {
  // Check if icon already exists
  const existingIcon = field.parentElement.querySelector('.securevault-icon');
  if (existingIcon) {
    return;
  }
  
  // Create icon container
  const iconContainer = document.createElement('div');
  iconContainer.className = 'securevault-icon';
  iconContainer.setAttribute('data-field-type', fieldType);
  
  // Style the icon
  iconContainer.style.position = 'absolute';
  iconContainer.style.zIndex = '9999';
  iconContainer.style.cursor = 'pointer';
  iconContainer.style.width = '20px';
  iconContainer.style.height = '20px';
  iconContainer.style.backgroundImage = 'url(' + chrome.runtime.getURL('icons/icon16.png') + ')';
  iconContainer.style.backgroundSize = 'contain';
  iconContainer.style.backgroundRepeat = 'no-repeat';
  
  // Position the icon relative to the field
  const fieldRect = field.getBoundingClientRect();
  const fieldStyles = window.getComputedStyle(field);
  
  // Make the parent position relative for absolute positioning of the icon
  if (field.parentElement.style.position !== 'relative' && 
      field.parentElement.style.position !== 'absolute') {
    field.parentElement.style.position = 'relative';
  }
  
  // Set position based on field type and available space
  if (fieldType === 'password-field') {
    iconContainer.style.right = '5px';
    iconContainer.style.top = '50%';
    iconContainer.style.transform = 'translateY(-50%)';
    
    // Adjust padding to make room for the icon
    field.style.paddingRight = '25px';
  } else {
    iconContainer.style.right = '5px';
    iconContainer.style.top = '50%';
    iconContainer.style.transform = 'translateY(-50%)';
    
    // Adjust padding to make room for the icon
    field.style.paddingRight = '25px';
  }
  
  // Add click event to show password list
  iconContainer.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Send message to open popup with credentials for this site
    chrome.runtime.sendMessage({
      action: 'openPopup',
      field: fieldType
    });
  });
  
  // Insert icon into the DOM
  field.parentElement.appendChild(iconContainer);
}

// Monitor for dynamically added form fields
function observeDOM() {
  // Options for the observer
  const observerConfig = {
    childList: true,
    subtree: true
  };
  
  // Create an observer instance
  const observer = new MutationObserver((mutations) => {
    let shouldCheckFields = false;
    
    // Check if relevant elements were added
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        for (let i = 0; i < mutation.addedNodes.length; i++) {
          const node = mutation.addedNodes[i];
          if (node.nodeType === 1) { // Element node
            if (node.tagName === 'FORM' || 
                node.tagName === 'INPUT' || 
                node.querySelector('input')) {
              shouldCheckFields = true;
              break;
            }
          }
        }
      }
    });
    
    if (shouldCheckFields) {
      addVaultIcons();
    }
  });
  
  // Start observing the document
  observer.observe(document.documentElement, observerConfig);
}

// Detect login forms when page loads
window.addEventListener('load', () => {
  addVaultIcons();
  observeDOM();
});

// Also check on DOMContentLoaded (some sites load forms earlier)
document.addEventListener('DOMContentLoaded', () => {
  addVaultIcons();
});

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'fillCredentials') {
    const { username, password } = message;
    const { passwordFields, usernameFields } = findPasswordFields();
    
    if (passwordFields.length > 0) {
      const passwordField = passwordFields[0];
      const usernameField = usernameFields.length > 0 ? usernameFields[0] : null;
      
      fillFormFields(usernameField, passwordField, username, password);
      
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'No password field found' });
    }
    
    return true;
  }
});

// Monitor form submissions to capture credentials
document.addEventListener('submit', (e) => {
  const form = e.target;
  if (form.tagName === 'FORM') {
    const { passwordFields, usernameFields } = findPasswordFields();
    
    if (passwordFields.length > 0) {
      const passwordField = passwordFields[0];
      const password = passwordField.value;
      
      if (password) {
        let username = '';
        
        if (usernameFields.length > 0) {
          username = usernameFields[0].value;
        }
        
        // Send credentials to background script
        chrome.runtime.sendMessage({
          action: 'captureCredential',
          credential: {
            url: window.location.href,
            username,
            password
          }
        });
      }
    }
  }
});
