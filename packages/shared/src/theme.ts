/** Appearance preference: force light/dark or follow the OS. */
export const themeSchemaValues = ['LIGHT', 'DARK', 'SYSTEM'] as const;
export type ThemePreference = (typeof themeSchemaValues)[number];

/** Default: follow OS `prefers-color-scheme` ([DEC-015]). */
export const DEFAULT_THEME: ThemePreference = 'SYSTEM';
