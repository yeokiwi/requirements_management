// ---------------------------------------------------------------------------
// CSV parsing and generation
// ---------------------------------------------------------------------------

/**
 * Parse a CSV string into an array of objects.
 * The first row is treated as headers / column names.
 */
export function parseCsv(text: string): Record<string, string>[] {
  const rows = parseRows(text);
  if (rows.length < 2) return [];

  const headers = rows[0];
  const results: Record<string, string>[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || (row.length === 1 && row[0] === "")) continue;

    const obj: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = j < row.length ? row[j] : "";
    }
    results.push(obj);
  }

  return results;
}

/**
 * Convert an array of objects to a CSV string.
 * If `columns` is supplied only those keys are included (in order);
 * otherwise all keys from the first object are used.
 */
export function toCsv(
  data: Record<string, any>[],
  columns?: string[],
): string {
  if (data.length === 0) return "";

  const cols = columns ?? Object.keys(data[0]);
  const lines: string[] = [];

  // Header row
  lines.push(cols.map(escapeField).join(","));

  // Data rows
  for (const row of data) {
    const values = cols.map((col) => {
      const val = row[col];
      if (val === null || val === undefined) return "";
      return String(val);
    });
    lines.push(values.map(escapeField).join(","));
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Parse raw CSV text into a 2D array of strings, handling quoted fields.
 */
function parseRows(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++; // skip escaped quote
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        current.push(field);
        field = "";
      } else if (ch === "\r" && next === "\n") {
        current.push(field);
        field = "";
        rows.push(current);
        current = [];
        i++; // skip \n
      } else if (ch === "\n") {
        current.push(field);
        field = "";
        rows.push(current);
        current = [];
      } else {
        field += ch;
      }
    }
  }

  // Last field / row
  current.push(field);
  if (current.length > 0) {
    rows.push(current);
  }

  return rows;
}

/**
 * Escape a CSV field – wrap in double quotes if it contains commas, quotes, or newlines.
 */
function escapeField(value: string): string {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
