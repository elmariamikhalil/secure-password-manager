document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const loginView = document.getElementById('login-view');
  const loadingView = document.getElementById('loading-view');
  const noCredentialsView = document.getElementById('no-credentials-view');
  const credentialsView = document.getElementById('credentials-view');
  const addEditView = document.getElementById('add-edit-view');
  const accountInfo = document.getElementById('account-info');
  const userEmail = document.getElementById('user-email');
  
  // Forms
  const loginForm = document.getElementById('login-form');
  const credentialForm = document.getElementById('credential-form');
  
  // Buttons
  const addPasswordBtn = document.getElementById('add-password-btn');
  const addCredentialBtn = document.getElementById('add-credential-btn');
  const cancelFormBtn = document.getElementById('cancel-form-btn');
  const openWebAppBtn = document.getElementById('open-web-app');
  const logoutBtns = [
    document.getElementById('logout-btn'),
    document.getElementById('logout-btn-2')
  ];
  const togglePasswordBtn = document.getElementById('toggle-password');
  const generatePasswordBtn = document.getElementById('generate-password');
  
  // Form fields
  const credentialUrl = document.getElementById('credential-url');
  const credentialUsername = document.getElementById('credential-username');
  const credentialPassword = document.getElementById('credential-password');
  
  // Lists
  const credentialsList = document.getElementById('credentials-list');
  
  // Error elements
  const loginError = document.getElementById('login-error');
  const formError = document.getElementById('form-error');
  
  // Site info
  const siteFavicon = document.getElementById('site-favicon');
  const siteDomain = document.getElementById('site-domain');
  
  // Global vars
  let currentTabUrl = '';
  let currentTabId = null;
  let currentDomain = '';
  let editingCredentialId = null;
  
  // Initialize the extension
  function init() {
    // Get current tab information
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs.length > 0) {
        const activeTab = tabs[0];
        currentTabUrl = activeTab.url;
        currentTabId = activeTab.id;
        
        try {
          const url = new URL(currentTabUrl);
          currentDomain = url.hostname;
          siteDomain.textContent = currentDomain;
          siteFavicon.src = `https://www.google.com/s2/favicons?domain=${currentDomain}&sz=64`;
        } catch(e) {
          console.error('Invalid URL:', e);
          currentDomain = '';
        }
        
        // Pre-fill the URL field when adding a new credential
        credentialUrl.value = currentTabUrl;
      }
      
      // Check if user is logged in
      checkAuthStatus();
    });
  }
  
  // Check if user is authenticated
  function checkAuthStatus() {
    chrome.storage.local.get(['authToken', 'user'], function(result) {
      if (result.authToken && result.user) {
        // User is logged in
        userEmail.textContent = result.user.email;
        accountInfo.classList.remove('hidden');
        
        // Check if encryption key is available in session
        chrome.storage.session.get(['encryptionKey'], function(sessionResult) {
          if (sessionResult.encryptionKey) {
            // Encryption key available, load credentials
            loadCredentials();
          } else {
            // Need to prompt for master password again
            showView(loginView);
          }
        });
      } else {
        // User is not logged in
        showView(loginView);
      }
    });
  }
  
  // Load credentials for current domain
  function loadCredentials() {
    showView(loadingView);
    
    if (!currentDomain) {
      showView(noCredentialsView);
      return;
    }
    
    // Send message to background script to fetch credentials
    chrome.runtime.sendMessage({
      action: 'getCredentialsForDomain',
      domain: currentDomain
    }, function(response) {
      if (response.success) {
        if (response.credentials && response.credentials.length > 0) {
          // Display credentials
          renderCredentialsList(response.credentials);
          showView(credentialsView);
        } else {
          // No credentials found for this domain
          showView(noCredentialsView);
        }
      } else {
        // Error fetching credentials
        loginError.textContent = response.error || 'Failed to load credentials';
        loginError.classList.remove('hidden');
        showView(loginView);
      }
    });
  }
  
  // Render the list of credentials
  function renderCredentialsList(credentials) {
    credentialsList.innerHTML = '';
    
    credentials.forEach(cred => {
      const credItem = document.createElement('div');
      credItem.className = 'credential-item';
      credItem.dataset.id = cred.id;
      
      const username = document.createElement('div');
      username.className = 'credential-username';
      username.textContent = cred.username;
      
      const actions = document.createElement('div');
      actions.className = 'credential-actions';
      
      const fillBtn = document.createElement('button');
      fillBtn.className = 'btn btn-sm btn-primary';
      fillBtn.textContent = 'Auto-fill';
      fillBtn.addEventListener('click', () => fillCredential(cred));
      
      const copyUsernameBtn = document.createElement('button');
      copyUsernameBtn.className = 'btn btn-sm btn-secondary';
      copyUsernameBtn.textContent = 'Copy Username';
      copyUsernameBtn.addEventListener('click', () => copyToClipboard(cred.username, 'Username copied'));
      
      const copyPasswordBtn = document.createElement('button');
      copyPasswordBtn.className = 'btn btn-sm btn-secondary';
      copyPasswordBtn.textContent = 'Copy Password';
      copyPasswordBtn.addEventListener('click', () => copyToClipboard(cred.password, 'Password copied'));
      
      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-sm btn-secondary';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => editCredential(cred));
      
      actions.appendChild(fillBtn);
      actions.appendChild(copyUsernameBtn);
      actions.appendChild(copyPasswordBtn);
      actions.appendChild(editBtn);
      
      credItem.appendChild(username);
      credItem.appendChild(actions);
      
      credentialsList.appendChild(credItem);
    });
  }
  
  // Auto-fill credentials in the active tab
  function fillCredential(credential) {
    chrome.tabs.sendMessage(currentTabId, {
      action: 'fillCredentials',
      username: credential.username,
      password: credential.password
    }, function(response) {
      if (response && response.success) {
        window.close(); // Close the popup after successful fill
      } else {
        // Show error or fallback
        alert('Could not auto-fill credentials. The page might not have compatible login fields.');
      }
    });
  }
  
  // Copy text to clipboard
  function copyToClipboard(text, successMessage) {
    navigator.clipboard.writeText(text)
      .then(() => {
        // Show success message (could implement a toast notification here)
        alert(successMessage);
      })
      .catch(err => {
        alert('Failed to copy text: ' + err);
      });
  }
  
  // Edit credential
  function editCredential(credential) {
    editingCredentialId = credential.id;
    document.getElementById('form-title').textContent = 'Edit Password';
    
    // Fill form fields
    credentialUrl.value = credential.url;
    credentialUsername.value = credential.username;
    credentialPassword.value = credential.password;
    document.getElementById('credential-notes').value = credential.notes || '';
    
    showView(addEditView);
  }
  
  // Show a specific view and hide others
  function showView(viewToShow) {
    // Hide all views
    [loginView, loadingView, noCredentialsView, credentialsView, addEditView].forEach(view => {
      view.classList.add('hidden');
    });
    
    // Show the requested view
    viewToShow.classList.remove('hidden');
  }
  
  // Reset form errors
  function resetFormErrors() {
    loginError.classList.add('hidden');
    formError.classList.add('hidden');
  }
  
  // Handle login form submission
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    resetFormErrors();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    showView(loadingView);
    
    // Send login request to background script
    chrome.runtime.sendMessage({
      action: 'login',
      email: email,
      password: password
    }, function(response) {
      if (response.success) {
        // Login successful
        userEmail.textContent = email;
        accountInfo.classList.remove('hidden');
        loadCredentials();
      } else {
        // Login failed
        loginError.textContent = response.error || 'Login failed';
        loginError.classList.remove('hidden');
        showView(loginView);
      }
    });
  });
  
  // Handle credential form submission
  credentialForm.addEventListener('submit', function(e) {
    e.preventDefault();
    resetFormErrors();
    
    const credential = {
      url: credentialUrl.value,
      username: credentialUsername.value,
      password: credentialPassword.value,
      notes: document.getElementById('credential-notes').value,
    };
    
    if (editingCredentialId) {
      credential.id = editingCredentialId;
    }
    
    showView(loadingView);
    
    // Send save request to background script
    chrome.runtime.sendMessage({
      action: editingCredentialId ? 'updateCredential' : 'addCredential',
      credential: credential
    }, function(response) {
      if (response.success) {
        // Save successful
        editingCredentialId = null;
        loadCredentials();
      } else {
        // Save failed
        formError.textContent = response.error || 'Failed to save credential';
        formError.classList.remove('hidden');
        showView(addEditView);
      }
    });
  });
  
  // Toggle password visibility
  togglePasswordBtn.addEventListener('click', function() {
    const passwordField = credentialPassword;
    const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordField.setAttribute('type', type);
  });
  
  // Generate random password
  generatePasswordBtn.addEventListener('click', function() {
    chrome.runtime.sendMessage({
      action: 'generatePassword'
    }, function(response) {
      if (response.success) {
        credentialPassword.value = response.password;
      }
    });
  });
  
  // Add new credential button
  addPasswordBtn.addEventListener('click', function() {
    editingCredentialId = null;
    document.getElementById('form-title').textContent = 'Add Password';
    
    // Reset form fields
    credentialForm.reset();
    credentialUrl.value = currentTabUrl;
    
    showView(addEditView);
  });
  
  // Add credential button in credentials view
  addCredentialBtn.addEventListener('click', function() {
    editingCredentialId = null;
    document.getElementById('form-title').textContent = 'Add Password';
    
    // Reset form fields
    credentialForm.reset();
    credentialUrl.value = currentTabUrl;
    
    showView(addEditView);
  });
  
  // Cancel form button
  cancelFormBtn.addEventListener('click', function() {
    if (credentialsList.children.length > 0) {
      showView(credentialsView);
    } else {
      showView(noCredentialsView);
    }
  });
  
  // Open web app button
  openWebAppBtn.addEventListener('click', function() {
    chrome.tabs.create({ url: 'http://your-password-manager-url.com' });
  });
  
  // Logout buttons
  logoutBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', function() {
        chrome.runtime.sendMessage({
          action: 'logout'
        }, function() {
          // Clear UI state
          accountInfo.classList.add('hidden');
          loginForm.reset();
          credentialForm.reset();
          showView(loginView);
        });
      });
    }
  });
  
  // Initialize the extension
  init();
});
