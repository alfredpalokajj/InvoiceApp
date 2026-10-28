import axios, { isAxiosError } from 'axios';

export const api = axios.create({ baseURL: '/api' });

let authToken: string | null = null;
let onUnauthorized: () => void = () => {};

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

api.interceptors.request.use((config) => {
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // An expired or revoked token: drop the session so the user is sent back to login.
    if (isAxiosError(err) && err.response?.status === 401 && authToken) onUnauthorized();
    return Promise.reject(err);
  },
);

/**
 * Stable error key for translation (`errors.<code>`).
 * The API returns ProblemDetails with a `code`; model validation errors come back as 400 without one.
 */
export function apiErrorCode(err: unknown): string {
  if (!isAxiosError(err)) return 'generic';
  if (!err.response) return 'network';
  const data = err.response.data as { code?: string; errors?: unknown } | undefined;
  if (data?.code) return data.code;
  if (err.response.status === 400 && data?.errors) return 'validation';
  if (err.response.status === 403) return 'forbidden';
  if (err.response.status === 404) return 'not_found';
  return 'generic';
}
