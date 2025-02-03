const admin = require("firebase-admin");
const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const fetch = require("node-fetch");

admin.initializeApp();

exports.anthropicProxy = functions.https.onRequest(
  async (request, response) => {
    // Use cors middleware
    await new Promise((resolve) => cors(request, response, resolve));

    try {
      const anthropicResponse = await fetch(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": functions.config().anthropic.key,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify(request.body),
        }
      );

      const data = await anthropicResponse.json();
      response.json(data);
    } catch (error) {
      console.error("Error:", error);
      response.status(500).json({ error: error.message });
    }
  }
);
