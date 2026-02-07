/**
 * Shared color helper utilities for NFL HQ
 */

/**
 * Theme colors - single source of truth for app-wide colors
 */
export const theme = {
  // Primary brand color (NFL blue)
  primary: '#0050A0',
  primaryHover: '#003d7a',

  // Status colors
  success: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  error: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
  warning: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
  },
  info: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
} as const;

/**
 * Standardized UI component classes
 */
export const ui = {
  // Card styles
  card: 'bg-white rounded-lg shadow-sm border border-gray-200',
  cardHover: 'bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow',

  // Button styles
  buttonBase: 'px-4 py-2 min-h-[44px] rounded-lg font-medium transition-colors cursor-pointer',
  buttonPrimary: 'px-4 py-2 min-h-[44px] rounded-lg font-medium transition-colors cursor-pointer bg-[#0050A0] text-white hover:bg-[#003d7a]',
  buttonSecondary: 'px-4 py-2 min-h-[44px] rounded-lg font-medium transition-colors cursor-pointer bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300',
  buttonGhost: 'px-4 py-2 min-h-[44px] rounded-lg font-medium transition-colors cursor-pointer text-gray-700 hover:bg-gray-100',

  // Container padding
  containerPadding: 'p-4 sm:p-6',

  // Table styles
  tableHeader: 'text-left font-semibold uppercase tracking-wide text-xs',
  tableCell: 'p-3 whitespace-nowrap',

  // Form styles
  input: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0050A0] focus:border-[#0050A0] outline-none transition-colors',
  select: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0050A0] focus:border-[#0050A0] outline-none transition-colors cursor-pointer',

  // Empty state
  emptyState: 'text-center py-12 text-gray-500',

  // Error state
  errorState: 'bg-red-50 border border-red-200 rounded-lg p-4 text-red-700',

  // Loading spinner
  spinner: 'animate-spin rounded-full h-8 w-8 border-b-2 border-[#0050A0]',
  spinnerLarge: 'animate-spin rounded-full h-12 w-12 border-b-2 border-[#0050A0]',
} as const;

/**
 * Calculate relative luminance of a hex color
 * Based on WCAG 2.1 formula
 */
function getLuminance(hex: string): number {
  const rgb = hex.replace('#', '').match(/.{2}/g);
  if (!rgb) return 0;

  const [r, g, b] = rgb.map(c => {
    const val = parseInt(c, 16) / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Check if white text has sufficient contrast on a background color
 * Returns true if white text is readable, false if dark text should be used
 * Uses WCAG 2.1 AA standard (4.5:1 contrast ratio)
 */
export function shouldUseWhiteText(hexColor: string): boolean {
  const bgLuminance = getLuminance(hexColor);
  const whiteLuminance = 1;
  const darkLuminance = 0; // Black

  // Contrast ratio formula: (L1 + 0.05) / (L2 + 0.05)
  const whiteContrast = (whiteLuminance + 0.05) / (bgLuminance + 0.05);
  const darkContrast = (bgLuminance + 0.05) / (darkLuminance + 0.05);

  // Use white text if contrast ratio with white is >= 4.5 (WCAG AA)
  // Or if white has better contrast than dark
  return whiteContrast >= 4.5 || whiteContrast > darkContrast;
}

/**
 * Get the appropriate text color (white or dark) for a background color
 */
export function getContrastTextColor(hexColor: string): string {
  return shouldUseWhiteText(hexColor) ? '#FFFFFF' : '#1a1a1a';
}

/**
 * Get Tailwind color classes for position badge based on position abbreviation
 * This is the single source of truth for position colors across the app
 */
export const getPositionColor = (position: string): string => {
  const pos = position.toUpperCase();

  // Quarterbacks
  if (pos === 'QB') {
    return 'bg-purple-100 text-purple-700 border-purple-200';
  }
  // Running Backs
  if (pos === 'RB' || pos === 'FB' || pos === 'HB') {
    return 'bg-green-100 text-green-700 border-green-200';
  }
  // Wide Receivers
  if (pos === 'WR') {
    return 'bg-blue-100 text-blue-700 border-blue-200';
  }
  // Tight Ends
  if (pos === 'TE') {
    return 'bg-orange-100 text-orange-700 border-orange-200';
  }
  // Offensive Line
  if (['OT', 'OG', 'C', 'OL', 'T', 'G', 'OC', 'LT', 'RT', 'LG', 'RG'].includes(pos)) {
    return 'bg-amber-100 text-amber-700 border-amber-200';
  }
  // Defensive Line
  if (['DE', 'DT', 'NT', 'DL', 'EDGE'].includes(pos)) {
    return 'bg-red-100 text-red-700 border-red-200';
  }
  // Linebackers
  if (['LB', 'ILB', 'OLB', 'MLB', 'WILL', 'MIKE', 'SAM'].includes(pos)) {
    return 'bg-indigo-100 text-indigo-700 border-indigo-200';
  }
  // Cornerbacks
  if (pos === 'CB') {
    return 'bg-teal-100 text-teal-700 border-teal-200';
  }
  // Safeties
  if (['S', 'FS', 'SS', 'SAF', 'DB'].includes(pos)) {
    return 'bg-cyan-100 text-cyan-700 border-cyan-200';
  }
  // Special Teams
  if (['K', 'P', 'LS', 'PR', 'KR'].includes(pos)) {
    return 'bg-pink-100 text-pink-700 border-pink-200';
  }

  return 'bg-gray-100 text-gray-700 border-gray-200';
};

/**
 * Get Tailwind color classes for injury status badge
 */
export const getStatusColor = (status: string): string => {
  const statusLower = status.toLowerCase();

  if (statusLower.includes('ir') || statusLower.includes('injured reserve')) {
    return 'bg-red-100 text-red-800 border-red-600';
  }
  if (statusLower.includes('pup') || statusLower.includes('physically unable')) {
    return 'bg-purple-50 text-purple-700 border-purple-400';
  }
  if (statusLower.includes('nfi') || statusLower.includes('non-football')) {
    return 'bg-indigo-50 text-indigo-700 border-indigo-400';
  }
  if (statusLower.includes('out')) {
    return 'bg-red-50 text-red-700 border-red-400';
  }
  if (statusLower.includes('doubtful')) {
    return 'bg-orange-50 text-orange-700 border-orange-400';
  }
  if (statusLower.includes('questionable')) {
    return 'bg-yellow-50 text-yellow-700 border-yellow-400';
  }
  if (statusLower.includes('probable')) {
    return 'bg-green-50 text-green-700 border-green-400';
  }

  return 'bg-gray-100 text-gray-700 border-gray-200';
};
