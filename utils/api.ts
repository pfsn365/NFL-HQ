// Utility to get the correct API base path
// API routes in Next.js do NOT use basePath - they're always at root
// This is a Next.js design - basePath only applies to pages, not API routes
export function getApiPath(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // API routes are always at root, regardless of basePath
  // Do NOT add /nfl-hq prefix to API routes
  return `/${cleanPath}`;
}
