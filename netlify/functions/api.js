const https = require("https");

exports.handler = async function(event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "No API key found in environment" }) };
  }

  let postData;
  try {
    const parsed = JSON.parse(event.body);
    postData = JSON.stringify(parsed);
  } catch(e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON: " + e.message }) };
  }

  return new Promise((resolve) => {
    const options = {
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Length": Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        resolve({ statusCode: res.statusCode, headers, body: data });
      });
    });

    req.on("error", (err) => {
      resolve({ statusCode: 500, headers, body: JSON.stringify({ error: "Request failed: " + err.message }) });
    });

    req.write(postData);
    req.end();
  });
};
