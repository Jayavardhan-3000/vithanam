// Vercel serverless function: proxies the data.gov.in mandi-price request so the
// browser never calls the government API directly (avoids CORS/network blocks).
// Must live at /api/mandi.js so Vercel serves it at /api/mandi.
const RESOURCE = "9ef84268-d588-465a-a308-a864a43d0070";

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST for this endpoint." });
  }

  try {
    // Vercel parses JSON bodies automatically, but be safe if it arrives as a string.
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    const { apiKey, commodity } = body || {};

    if (!apiKey || typeof apiKey !== "string") {
      return res.status(400).json({ error: "Add your data.gov.in API key in the app Settings and save it." });
    }
    if (!commodity || typeof commodity !== "string") {
      return res.status(400).json({ error: "A crop/commodity is required." });
    }

    const url = new URL(`https://api.data.gov.in/resource/${RESOURCE}`);
    url.searchParams.set("api-key", apiKey.trim());
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "10");
    url.searchParams.set("filters[commodity]", commodity.trim());

    const upstream = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(20000),
    });
    const text = await upstream.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // Short, safe diagnostic instead of a confusing JSON parse error (never includes the key).
      const preview = text.replace(/\s+/g, " ").slice(0, 140);
      return res.status(502).json({
        error: `Government API returned non-JSON content (HTTP ${upstream.status}, content-type ${upstream.headers.get("content-type") || "unknown"}). Preview: ${preview || "(empty response)"}`,
      });
    }

    if (!upstream.ok) {
      // Always send a valid HTTP error status; 4xx from upstream (bad key etc.) is passed through.
      const status = upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502;
      return res.status(status).json({
        error: data.message || data.error || `Government API returned HTTP ${upstream.status}.`,
      });
    }

    if (!Array.isArray(data.records)) {
      return res.status(502).json({
        error: data.message || "Government API returned JSON, but no records array was present.",
      });
    }

    // Keep only rows with a usable numeric modal price.
    const records = data.records
      .filter((r) => r && r.market && Number.isFinite(parseFloat(r.modal_price)))
      .map((r) => ({
        market: r.market,
        state: r.state || "",
        district: r.district || "",
        commodity: r.commodity || commodity,
        arrival_date: r.arrival_date || "",
        modal_price: parseFloat(r.modal_price),
      }));

    return res.status(200).json({ records, message: data.message || null });
  } catch (error) {
    const timedOut = error && (error.name === "TimeoutError" || error.name === "AbortError");
    return res.status(502).json({
      error: timedOut
        ? "data.gov.in took too long to respond. Please try again."
        : "Could not reach data.gov.in from the server. Check API availability and try again.",
    });
  }
};
