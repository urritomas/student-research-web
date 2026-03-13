const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Normalize trailing slashes to prevent accidental double slashes when joining paths.
export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, '');
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
