# SageCore PWA v0.7.0
Standalone iPhone-installable PWA. The UI/service worker can work offline, but AI answers require internet and the configured server-side AI API.

## Deploy (no Mac required)
1. Create an account/project on a host that supports serverless functions (this package is prepared for Vercel).
2. Upload/import this folder.
3. Add server environment variable `OPENAI_API_KEY` (never put the key in app.js).
4. Optional: `OPENAI_MODEL`.
5. Deploy and open the HTTPS URL in Safari on iPhone.
6. Safari Share -> Add to Home Screen.

## Privacy/security
The API key stays server-side. Chat history is stored locally in the browser; messages sent for AI replies are sent to the configured AI service.
