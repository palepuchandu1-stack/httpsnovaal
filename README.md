# Nova AI

Nova AI is Palepu Chandu’s Telugu and English AI assistant, adapted from the supplied website source while preserving its original interface and creator credits. It includes conversational AI, optional web search, image and PDF analysis, image generation, browser voice input, and read-aloud responses.

The frontend uses React 19 and Vite. Modern Netlify Functions provide same-origin API endpoints, and Netlify AI Gateway connects to OpenAI for chat and Gemini for images. Provider credentials stay on the server. No API keys belong in frontend code.

## Local development

Use Node.js 22 or later and the Netlify CLI. Install dependencies with `npm install`, link the project using `netlify link`, then run `npm run dev`. Open http://localhost:8889. Gateway access requires a production deployment and available Netlify AI credits; use a linked project for local platform configuration.

Netlify installs dependencies with development tooling included, runs `npm run build`, and publishes `dist`. The committed npm lockfile keeps dependency resolution reproducible. API routes are `/api/chat`, `/api/generate-image`, and `/api/health`. The health route confirms the application endpoint is reachable, rather than testing provider availability.

Chat supports PNG, JPEG, WebP, GIF, or PDF attachments up to 3 MB, one attachment at a time. Conversations and generated images stay in the current page session and clear on reload; no chat history is stored. Web search is opt-in. Voice input depends on browser support and microphone permission, with Telugu selected by default. Read-aloud depends on installed browser voices.

AI requests use Netlify credits. The APIs apply per-IP request limits. Provider errors appear inline without exposing internal configuration.
