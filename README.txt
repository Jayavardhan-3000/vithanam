# Vithanam — Vercel deployment files

This package keeps the original single-page app and adds a Vercel serverless endpoint for mandi prices.

## Deploy
1. Extract this ZIP.
2. Replace the files in your GitHub repository with the contents of this folder:
   - `index.html` at the repository root
   - `api/mandi.js` in an `api` folder
3. Commit and push the changes to the branch connected to Vercel.
4. Wait for Vercel to redeploy.
5. Open the app Settings, enter your data.gov.in key, and click Save.
6. Reload the app and check Market price.

## Notes
- The app sends the saved data.gov.in key to `/api/mandi` in a POST request. Because the key is entered in a browser-based app, it is not a secret from that browser's user. Do not use a privileged key here.
- If data.gov.in itself is unavailable, the proxy cannot make it available; the app will show a clear error and retain sample prices.
- The Vercel project must use the repository root as its Root Directory.


## If the Market price card still errors
The API endpoint now reports the upstream HTTP status, content type, and a short response preview when the government service sends a text/HTML error page. This helps identify an invalid endpoint, access restriction, or upstream outage without exposing the API key.
