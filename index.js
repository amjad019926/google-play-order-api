const express = require("express");
const { google } = require("googleapis");
const fs = require("fs");

const app = express();
app.use(express.json());

// =======================================
// CREATE SERVICE ACCOUNT FILE FROM ENV
// =======================================
if (!process.env.SERVICE_ACCOUNT_JSON) {
  console.error("SERVICE_ACCOUNT_JSON not found!");
  process.exit(1);
}

fs.writeFileSync(
  "service-account.json",
  process.env.SERVICE_ACCOUNT_JSON
);

// =======================================
// GOOGLE AUTH SETUP
// =======================================
const auth = new google.auth.GoogleAuth({
  keyFile: "service-account.json",
  scopes: ["https://www.googleapis.com/auth/androidpublisher"],
});

// =======================================
// HOME ROUTE
// =======================================
app.get("/", (req, res) => {
  res.json({
    status: "Server running",
    message: "Google Play Order API Active"
  });
});

// =======================================
// ORDER DETAILS BY ORDER ID
// =======================================
app.post("/order", async (req, res) => {
  try {
    const { packageName, orderId } = req.body;

    if (!packageName || !orderId) {
      return res.status(400).json({
        error: "packageName and orderId required"
      });
    }

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    const url =
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/orders/${orderId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken.token}`,
      },
    });

    const data = await response.json();

    return res.json(data);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error.message
    });
  }
});

// =======================================
// START SERVER
// =======================================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
