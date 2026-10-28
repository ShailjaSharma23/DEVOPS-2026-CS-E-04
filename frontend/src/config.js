// Centralized API base URL config
// In production (e.g. Render Static Site), import.meta.env.VITE_API_URL points to the backend web service.
// In local development, it falls back to empty string so Vite proxy handles /api/v1.
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
