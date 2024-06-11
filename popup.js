document.addEventListener('DOMContentLoaded', function () {
    const checkButton = document.getElementById('checkButton');
    const statusDiv = document.getElementById('status');
  
    // Initial status
    statusDiv.innerHTML = "Model is loading...";
    statusDiv.style.color = "blue";
  
    // Check model status on popup load
    chrome.runtime.sendMessage({ action: "checkModelStatus" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error checking model status:", chrome.runtime.lastError.message);
        statusDiv.innerHTML = "Error checking model status.";
        statusDiv.style.color = "red";
        return;
      }
  
      if (response && response.action === "modelLoaded") {
        statusDiv.innerHTML = "Model loaded. You can check URLs now.";
        statusDiv.style.color = "green";
      } else if (response && response.action === "modelLoadError") {
        statusDiv.innerHTML = `Error loading model: ${response.error}`;
        statusDiv.style.color = "red";
      }
    });
  
    checkButton.addEventListener('click', function () {
      console.log("Check button clicked");  // Log when the button is clicked
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const url = tabs[0].url;
        console.log("Current URL:", url);  // Log the current URL
        chrome.runtime.sendMessage({ action: "checkURL", url: url }, (response) => {
          if (chrome.runtime.lastError) {
            console.error("Error sending message:", chrome.runtime.lastError.message);
            statusDiv.innerHTML = "Error checking URL.";
            statusDiv.style.color = "red";
            return;
          }
  
          console.log("Response received:", response);  // Log the response received
  
          if (response.error) {
            console.error("Error in response:", response.error);
            statusDiv.innerHTML = "Error checking URL.";
            statusDiv.style.color = "red";
          } else if (response.isPhishing) {
            statusDiv.innerHTML = "Warning: This URL may be a phishing site!";
            statusDiv.style.color = "red";
          } else {
            statusDiv.innerHTML = "This URL seems safe.";
            statusDiv.style.color = "green";
          }
        });
      });
    });
  });
  