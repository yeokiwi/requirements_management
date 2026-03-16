// ---------------------------------------------------------------------------
// Rich-text / HTML utilities
// ---------------------------------------------------------------------------

/**
 * Strip all HTML tags from a string and return plain text.
 */
export function stripRichText(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract all @REQ-XXXX style mention references from an HTML string.
 *
 * Matches patterns like `@REQ-0001`, `@SYS-0042`, `@HW-123`, etc.
 * Returns an array of unique matched references (without the leading `@`).
 */
export function extractMentions(html: string): string[] {
  if (!html) return [];
  const plain = stripRichText(html);
  const regex = /@([A-Z]{2,10}-\d+)/g;
  const mentions = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(plain)) !== null) {
    mentions.add(match[1]);
  }
  return Array.from(mentions);
}
