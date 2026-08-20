// Vercel only auto-detects Serverless Functions in a top-level `api/`
// directory, so this thin file just re-exports the real implementation,
// which lives in backend/api/ alongside the rest of the backend code.
export { default, config } from '../backend/api/chat.js';
