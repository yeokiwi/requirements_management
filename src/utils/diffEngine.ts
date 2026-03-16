// ---------------------------------------------------------------------------
// Object diff engine
// ---------------------------------------------------------------------------

export interface FieldDiff {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

/**
 * Compare two objects and return an array of changed fields.
 * Only top-level fields are compared; nested objects are compared by JSON serialization.
 */
export function diffObjects(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>,
): FieldDiff[] {
  const diffs: FieldDiff[] = [];
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  for (const key of allKeys) {
    const oldVal = oldObj[key];
    const newVal = newObj[key];

    const oldSer = JSON.stringify(oldVal);
    const newSer = JSON.stringify(newVal);

    if (oldSer !== newSer) {
      diffs.push({ field: key, oldValue: oldVal, newValue: newVal });
    }
  }

  return diffs;
}

/**
 * Generate a human-readable summary from a list of field diffs.
 */
export function generateChangeDescription(diffs: FieldDiff[]): string {
  if (diffs.length === 0) {
    return 'No changes.';
  }

  const lines = diffs.map((d) => {
    const oldStr = formatValue(d.oldValue);
    const newStr = formatValue(d.newValue);

    if (d.oldValue === undefined) {
      return `Added "${d.field}" with value ${newStr}`;
    }
    if (d.newValue === undefined) {
      return `Removed "${d.field}" (was ${oldStr})`;
    }
    return `Changed "${d.field}" from ${oldStr} to ${newStr}`;
  });

  return lines.join('; ') + '.';
}

function formatValue(val: unknown): string {
  if (val === undefined || val === null) return 'empty';
  if (typeof val === 'string') return `"${val}"`;
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}
