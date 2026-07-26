/**
 * BDS Design Tokens
 *
 * Central source of truth for the custom theming layer sitting on top of
 * Angular Material. Downstream teams (digital-banking-shell, advisor-console,
 * and others) consume these tokens indirectly through BDS components rather
 * than reaching into Material's theme directly, so a Material major-version
 * bump should never require a change in consuming apps.
 */
export const BDS_COLOR_TOKENS = {
  brandPrimary: '#012169',   // BofA-style deep blue, placeholder for demo purposes
  brandAccent: '#E31837',    // placeholder accent red
  surface: '#FFFFFF',
  surfaceMuted: '#F4F6F8',
  textPrimary: '#0B1B32',
  textInverse: '#FFFFFF',
  success: '#1E7A34',
  warning: '#B26A00',
  danger: '#B3261E',
} as const;

export const BDS_SPACING_TOKENS = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
} as const;

export const BDS_RADIUS_TOKENS = {
  sm: '4px',
  md: '8px',
  pill: '999px',
} as const;

export type BdsButtonVariant = 'primary' | 'secondary' | 'danger';
export type BdsAlertSeverity = 'info' | 'success' | 'warning' | 'danger';
