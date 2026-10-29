const FALLBACK_TIME_ZONES = [
  'Asia/Tehran',
  'UTC',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Istanbul',
  'Asia/Dubai',
  'Asia/Tokyo',
  'America/New_York',
  'America/Los_Angeles',
] as const;

/** IANA time zone ids for profile dropdown (browser list when available). */
export function listTimeZones(): string[] {
  const intlWithZones = Intl as typeof Intl & {
    supportedValuesOf?: (key: string) => string[];
  };

  let zones: string[];
  try {
    zones =
      typeof intlWithZones.supportedValuesOf === 'function'
        ? [...intlWithZones.supportedValuesOf('timeZone')]
        : [...FALLBACK_TIME_ZONES];
  } catch {
    zones = [...FALLBACK_TIME_ZONES];
  }

  return zones.sort((a, b) => a.localeCompare(b));
}

export function ensureTimeZoneOption(zones: string[], timeZone: string | null | undefined): string[] {
  if (!timeZone || zones.includes(timeZone)) {
    return zones;
  }
  return [...zones, timeZone].sort((a, b) => a.localeCompare(b));
}
