/** Frontend runtime configuration derived from Vite env vars. */
export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api',
} as const;
