// background.js - Background service worker for SecureVault extension

chrome.runtime.onInstalled.addListener(function () {
  console.log("SecureVault extension installed");
});

// In background.js, check the response handling
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "getVaultItems") {
    console.log("Background received getVaultItems request");

    // Get auth token
    chrome.storage.local.get(["token"], function (result) {
      if (!result.token) {
        console.log("No token found, not logged in");
        sendResponse({ success: false, error: "Not logged in" });
        return;
      }

      console.log("Token found, fetching vault items");

      // Fetch vault items from API
      fetch("https://kael.es/api/vault", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${result.token}`,
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          console.log("API response status:", response.status);
          if (!response.ok) {
            throw new Error(`API response error: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          console.log("API data received:", data ? "data exists" : "no data");
          if (data && data.vaultItems) {
            console.log("Number of vault items:", data.vaultItems.length);
          }
          sendResponse({ success: true, data: data });
        })
        .catch((error) => {
          console.error("API fetch error:", error);
          sendResponse({ success: false, error: error.message });
        });
    });

    return true; // Indicate async response
  }
});

// Optional: Add context menu for filling credentials
chrome.contextMenus.create({
  id: "secureVault",
  title: "SecureVault",
  contexts: ["page"],
});

chrome.contextMenus.create({
  id: "fillCredentials",
  parentId: "secureVault",
  title: "Fill Login Details",
  contexts: ["page"],
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "fillCredentials") {
    // Get current domain
    const url = new URL(tab.url);
    const domain = url.hostname;

    // Get vault items for this domain
    chrome.storage.local.get(["token"], function (result) {
      if (!result.token) {
        return;
      }

      fetch(`https://kael.es/api/vault/domain/${domain}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${result.token}`,
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.vaultItems && data.vaultItems.length > 0) {
            // If we have vault items for this domain, decrypt the first one
            chrome.storage.local.get(
              ["encryptionKey"],
              async function (keyResult) {
                if (!keyResult.encryptionKey) {
                  return;
                }

                try {
                  // This would require decryption logic - simplified here
                  // In a real implementation, you would call a utility function to decrypt
                  chrome.tabs.sendMessage(tab.id, {
                    action: "fillCredentials",
                    username: "username_here", // Replace with actual decrypted username
                    password: "password_here", // Replace with actual decrypted password
                  });
                } catch (error) {
                  console.error("Error decrypting vault item:", error);
                }
              }
            );
          }
        })
        .catch((error) => {
          console.error("Error fetching vault items for domain:", error);
        });
    });
  }
});

// Listen for tab updates to check for password fields
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    !tab.url.startsWith("chrome://")
  ) {
    // Check if the page has password fields
    chrome.tabs.executeScript(
      tabId,
      {
        code: `document.querySelectorAll('input[type="password"]').length > 0`,
      },
      (results) => {
        if (chrome.runtime.lastError) {
          // Handle errors
          return;
        }

        if (results && results[0]) {
          // If password fields are found, show page action
          chrome.pageAction.show(tabId);
        }
      }
    );
  }
});
