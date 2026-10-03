// Vercel serverless function: proxies the data.gov.in request so the browser
// does not call the government API directly (which can fail due to browser/network restrictions).
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST for this endpoint." });
  }

  try {
    const { apiKey, commodity } = req.body || {};
    if (!apiKey || typeof apiKey !== "string") {
      return res.status(400).json({ error: "Add your data.gov.in API key in the app Settings and save it." });
    }
    if (!commodity || typeof commodity !== "string") {
      return res.status(400).json({ error: "A crop/commodity is required." });
    }

    const url = new URL("https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070");
    url.searchParams.set("api-key", apiKey);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "5");
    url.searchParams.set("filters[commodity]", commodity);

    const upstream = await fetch(url.toString(), { headers: { Accept: "application/json" } });
    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // Return a short, safe diagnostic rather than throwing a confusing JSON parse error.
      const preview = text.replace(/\\s+/g, " ").slice(0, 140);
      return res.status(502).json({
        error: `Government API returned non-JSON content (HTTP ${upstream.status}, content-type ${upstream.headers.get("content-type") || "unknown"}). Preview: ${preview || "(empty response)"}`,
      });
    }

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: data.message || data.error || `Government API returned HTTP ${upstream.status}.`
      });
    }

    if (!Array.isArray(data.records)) {
      return res.status(502).json({
        error: data.message || "Government API returned JSON, but no records array was present."
      });
    }

    return res.status(200).json({
      records: data.records,
      message: data.message || null
    });
  } catch (error) {
    return res.status(502).json({
      error: "Could not reach data.gov.in from the server. Check API availability and try again."
    });
  }
};
