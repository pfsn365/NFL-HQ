// Utility to get the correct API base path
// API routes are NOT affected by basePath in Next.js - they're always at root
export function getApiPath(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // API routes are always at the root, regardless of basePath
  return `/${cleanPath}`;
}
