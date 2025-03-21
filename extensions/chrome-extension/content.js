// content.js - Content script injected into web pages
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "fillCredentials") {
    fillCredentials(message.username, message.password);
    sendResponse({ success: true });
  }
  return true;
});

// Function to find and fill username/password fields
function fillCredentials(username, password) {
  // Find username field
  const usernameFields = findUsernameFields();
  if (usernameFields.length > 0) {
    // Fill the first matching username field
    setFieldValue(usernameFields[0], username);
  }

  // Find password field
  const passwordFields = findPasswordFields();
  if (passwordFields.length > 0) {
    // Fill the first matching password field
    setFieldValue(passwordFields[0], password);
  }
}

// Function to find username input fields
function findUsernameFields() {
  const selectors = [
    'input[type="email"]',
    'input[name="email"]',
    'input[id="email"]',
    'input[name="username"]',
    'input[id="username"]',
    'input[autocomplete="username"]',
    'input[autocomplete="email"]',
  ];

  return Array.from(document.querySelectorAll(selectors.join(",")));
}

// Function to find password input fields
function findPasswordFields() {
  return Array.from(document.querySelectorAll('input[type="password"]'));
}

// Function to set value and trigger events
function setFieldValue(field, value) {
  field.value = value;

  // Trigger events to notify the page that the field was updated
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
  field.dispatchEvent(new Event("blur", { bubbles: true }));
}
