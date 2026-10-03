# Vithanam — Vercel deployment

## Required repository layout
```
index.html        <- the app (repo root)
api/mandi.js      <- serverless proxy for mandi prices (MUST be inside api/)
vercel.json       <- runs the function in Mumbai (bom1); data.gov.in can block non-Indian IPs
README.md
```
Delete the old root-level `mandi.js` and `inddfgex.html`.

## Deploy
1. Put the files above in the repo and push to the branch connected to Vercel.
2. In Vercel > Project Settings, the Root Directory must be the repo root.
3. After deploy, open `https://<your-app>.vercel.app/api/mandi` — you should see
   `{"error":"Use POST for this endpoint."}` (a 404 means the file is in the wrong place).
4. In the app, open Settings, enter your data.gov.in key, Save, and reload.

## Notes
- The key is entered in the browser, so it is not secret from that browser's user. Don't use a privileged key.
- If the Market price card shows an error, the message now says what failed (missing endpoint, bad key, upstream outage, timeout).
