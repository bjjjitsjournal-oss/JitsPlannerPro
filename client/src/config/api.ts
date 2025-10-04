export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export function apiUrl(path: string) {
  if (!path.startsWith('/')) path = '/' + path;
  return ${API_BASE};
}