# Project architecture

This is the original uploaded Nova AI React/Vite site, adapted for Netlify hosting. Preserve its visual design and Palepu Chandu attribution unless asked to change them.

- `src/App.jsx`: chat session state, API requests, attachments, voice input, read-aloud, and image tool.
- `src/style.css`: original responsive visual theme plus accessibility and mobile tool styles.
- `src/main.jsx`: React entry point.
- `index.html`: document title and share metadata.
- `netlify/functions/chat.mts`: validated chat and multimodal requests through OpenAI Responses and Netlify AI Gateway.
- `netlify/functions/generate-image.mts`: Gemini image generation with a streamed JSON response to support larger output.
- `netlify/functions/health.mts`: endpoint availability only.
- `netlify.toml`: Vite deployment, local Netlify development, and SPA fallback.

Use modern TypeScript Netlify Functions and official provider SDKs. Read provider credentials only on the server. Return generic public errors rather than raw provider errors. Use same-origin API routes. Keep messages as plain text to avoid injecting model-generated HTML. Retain upload type and size checks on both sides. Function rate limits are declarative platform limits, not in-memory counters.

State is intentionally limited to the current browser page session, matching the uploaded source. There is no saved chat history or account system. Use Netlify Database or Blobs if persistence is added. Browser voice features need no transcription server. Do not reinstate the Express server or Vite proxy from the original ZIP: Netlify Functions replace them.

For local development, use `npm run dev` on port 8889 after installing dependencies and linking Netlify. Deployment builds the Vite frontend automatically.
