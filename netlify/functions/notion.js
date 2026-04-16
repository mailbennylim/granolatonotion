// This is a Netlify Function — a small piece of server-side code that runs
// on Netlify's servers, not in the browser. Because it runs on a server,
// it can call Notion's API without hitting the CORS restriction that
// blocked us when calling from the browser directly.
//
// Think of it as a trusted middleman:
//   Browser → this function → Notion API → this function → Browser
//
// The browser never touches Notion directly — it only talks to its
// own Netlify server, which Notion is happy to receive requests from.

exports.handler = async function (event) {
  // We only accept POST requests — the browser sends us the Notion API
  // path, the token, and the request body, and we forward it all to Notion.
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  // payload.path   — the Notion API endpoint, e.g. "/v1/databases/abc123"
  // payload.token  — the Notion integration secret
  // payload.method — GET or POST
  // payload.body   — the request body (for POST requests)
  const { path, token, method = "GET", body } = payload;

  if (!path || !token) {
    return { statusCode: 400, body: "Missing path or token" };
  }

  try {
    const notionRes = await fetch(`https://api.notion.com${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      // Only include a body for non-GET requests
      ...(method !== "GET" && body ? { body: JSON.stringify(body) } : {}),
    });

    const data = await notionRes.json();

    return {
      statusCode: notionRes.status,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message }),
    };
  }
};
