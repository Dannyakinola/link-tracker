// API endpoints
export const API_ENDPOINTS = {
  LINKS: '/api/links',
  ANALYTICS: '/api/analytics',
  AUTH: '/api/auth',
};

// Time periods for analytics
export const TIME_PERIODS = [
  { value: '1d', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'all', label: 'All Time' },
];

// Device types
export const DEVICE_TYPES = {
  desktop: 'Desktop',
  mobile: 'Mobile',
  tablet: 'Tablet',
  unknown: 'Unknown',
};

// Browser names
export const BROWSER_NAMES = {
  chrome: 'Chrome',
  firefox: 'Firefox',
  safari: 'Safari',
  edge: 'Edge',
  opera: 'Opera',
  ie: 'Internet Explorer',
  unknown: 'Unknown',
};

// Operating systems
export const OPERATING_SYSTEMS = {
  windows: 'Windows',
  macos: 'macOS',
  linux: 'Linux',
  android: 'Android',
  ios: 'iOS',
  unknown: 'Unknown',
};

// Chart colors
export const CHART_COLORS = {
  primary: '#4f46e5',
  secondary: '#0ea5e9',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#8b5cf6',
  light: '#6b7280',
  dark: '#1f2937',
};

// Default UTM parameters
export const DEFAULT_UTM_PARAMS = {
  utm_source: '',
  utm_medium: '',
  utm_campaign: '',
  utm_term: '',
  utm_content: '',
};

// Link