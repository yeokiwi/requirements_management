import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a UUID v4 identifier.
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Generate a human-readable display ID.
 *
 * @param prefix - Prefix string (e.g. "SYS", "HW")
 * @param sequence - Numeric sequence value
 * @param format - Optional format pattern. Defaults to 4-digit zero-padded.
 *                 Use "#" as digit placeholder (e.g. "####" → "0042").
 * @returns Formatted display ID such as "SYS-0042"
 */
export function generateDisplayId(
  prefix: string,
  sequence: number,
  format?: string,
): string {
  const pattern = format ?? '####';
  const digits = pattern.replace(/[^#]/g, '').length || 4;
  const padded = String(sequence).padStart(digits, '0');

  // Replace '#' placeholders left-to-right with padded digits
  let idx = 0;
  const suffix = pattern.replace(/#/g, () => padded[idx++] ?? '0');

  return `${prefix}-${suffix}`;
}
