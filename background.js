class RandomForestClassifier {
  constructor(trees) {
    this.trees = trees;
  }

  predict(features) {
    console.log("Predict called with features:", features);  // Log features used for prediction
    const votes = this.trees.map(tree => this.predictTree(tree, features));
    console.log("Votes from all trees:", votes);  // Log votes from all trees
    const prediction = this.majorityVote(votes);
    console.log("Final prediction result (probabilities):", prediction);  // Log the prediction result
    return prediction;
  }

  predictTree(node, features) {
    console.log("Current node:", node);  // Log the current node
    if (node.isLeaf) {
      console.log("Leaf node prediction:", node.prediction);  // Log leaf node prediction
      return node.prediction;
    } else if (Array.isArray(node)) {
      console.log("Array node prediction:", node);  // Log array node prediction
      return node[0];  // Assuming this is the final prediction array
    } else if (features[node.feature] <= node.threshold) {
      return this.predictTree(node.left, features);
    } else {
      return this.predictTree(node.right, features);
    }
  }

  majorityVote(votes) {
    const voteCounts = [0, 0];  // Assuming two classes: [Not Phishing, Phishing]
    for (const vote of votes) {
      if (Array.isArray(vote) && vote.length === 2) {
        voteCounts[0] += parseFloat(vote[0]);
        voteCounts[1] += parseFloat(vote[1]);
      } else {
        console.error("Unexpected vote format:", vote);
      }
    }
    const totalVotes = voteCounts[0] + voteCounts[1];
    if (totalVotes === 0) {
      return [0, 0];  // Avoid division by zero
    }
    return [voteCounts[0] / totalVotes, voteCounts[1] / totalVotes];  // Return normalized probabilities
  }
}


let model;

// Function to initialize the model
function initializeModel() {
  return fetch(chrome.runtime.getURL('random_forest_trees.json'))
    .then(response => response.json())
    .then(trees => {
      console.log("Model trees loaded:", trees);
      model = new RandomForestClassifier(trees);
      console.log("RandomForestClassifier initialized");
    })
    .catch(error => {
      console.error("Error loading model:", error);
      throw error;
    });
}

// Call the initialize function and setup message listeners
initializeModel().then(() => {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "checkURL") {
      console.log("Received URL for checking:", request.url);
      if (model) {
        try {
          const urlFeatures = extractFeaturesFromURL(request.url);
          console.log("Extracted features:", urlFeatures);

          const prediction = model.predict(urlFeatures);
          console.log("Prediction result (as array):", prediction);

          let isPhishing = false;
          if (Array.isArray(prediction) && prediction.length === 2) {
            console.log(`Prediction probabilities - Not Phishing: ${prediction[0]}, Phishing: ${prediction[1]}`);
            isPhishing = prediction[1] > prediction[0];
          } else {
            console.error("Unexpected prediction format:", prediction);
          }

          sendResponse({ isPhishing });

        } catch (error) {
          console.error("Error during prediction:", error);
          sendResponse({ error: "Error during prediction." });
        }
      } else {
        console.error("Model is not loaded yet.");
        sendResponse({ error: "Model is not loaded yet." });
      }
    } else if (request.action === "checkModelStatus") {
      if (model) {
        sendResponse({ action: "modelLoaded" });
      } else {
        sendResponse({ action: "modelLoadError", error: "Model is not loaded yet." });
      }
    }
    return true;
  });
}).catch(error => {
  console.error("Failed to initialize model:", error);
});

// Extract features from URL
function extractFeaturesFromURL(url) {
  console.log("Extracting features from URL:", url);
  const urlObj = new URL(url);
  const fullUrl = urlObj.href;

  const features = {
    url_length: fullUrl.length,
    n_dots: (fullUrl.match(/\./g) || []).length,
    n_hyphens: (fullUrl.match(/-/g) || []).length,
    n_underline: (fullUrl.match(/_/g) || []).length,
    n_slash: (fullUrl.match(/\//g) || []).length,
    n_questionmark: (fullUrl.match(/\?/g) || []).length,
    n_equal: (fullUrl.match(/=/g) || []).length,
    n_at: (fullUrl.match(/@/g) || []).length,
    n_and: (fullUrl.match(/&/g) || []).length,
    n_exclamation: (fullUrl.match(/!/g) || []).length,
    n_space: (fullUrl.match(/ /g) || []).length,
    n_tilde: (fullUrl.match(/~/g) || []).length,
    n_comma: (fullUrl.match(/,/g) || []).length,
    n_plus: (fullUrl.match(/\+/g) || []).length,
    n_asterisk: (fullUrl.match(/\*/g) || []).length,
    n_hastag: (fullUrl.match(/#/g) || []).length,
    n_dollar: (fullUrl.match(/\$/g) || []).length,
    n_percent: (fullUrl.match(/%/g) || []).length,
    n_redirection: (fullUrl.match(/\/\/+/g) || []).length,
  };

  // Additional calculated features
  features.total_special_characters = features.n_questionmark + features.n_equal + features.n_exclamation;
  features.total_redirection_specials = features.n_slash + features.n_redirection + features.n_percent;

  const extractedFeaturesArray = [
    features.url_length,
    features.n_dots,
    features.n_hyphens,
    features.n_underline,
    features.n_slash,
    features.n_questionmark,
    features.n_equal,
    features.n_at,
    features.n_and,
    features.n_exclamation,
    features.n_space,
    features.n_tilde,
    features.n_comma,
    features.n_plus,
    features.n_asterisk,
    features.n_hastag,
    features.n_dollar,
    features.n_percent,
    features.n_redirection,
    features.total_special_characters,
    features.total_redirection_specials
  ];

  console.log("Extracted features array:", extractedFeaturesArray);
  return extractedFeaturesArray;
}
