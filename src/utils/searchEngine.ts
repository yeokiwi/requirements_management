import type { Requirement } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SearchResult {
  requirementId: string;
  score: number;
  matches: string[];
}

interface IndexEntry {
  requirementId: string;
  field: string;
  term: string;
}

// ---------------------------------------------------------------------------
// Search engine
// ---------------------------------------------------------------------------

export class SearchEngine {
  private index: IndexEntry[] = [];
  private termFrequency: Map<string, number> = new Map();
  private docCount = 0;

  /**
   * Build an inverted index from an array of requirements.
   * Indexes: displayId (requirementId), title, description (HTML stripped), tags, owner (createdBy).
   */
  buildIndex(requirements: Requirement[]): void {
    this.index = [];
    this.termFrequency = new Map();
    this.docCount = requirements.length;

    for (const req of requirements) {
      const fields: { field: string; text: string }[] = [
        { field: 'displayId', text: req.requirementId ?? '' },
        { field: 'title', text: req.title ?? '' },
        { field: 'description', text: this.stripHtml(req.description ?? '') },
        { field: 'tags', text: (req.tags ?? []).join(' ') },
        { field: 'owner', text: req.createdBy ?? '' },
      ];

      const seenTerms = new Set<string>();

      for (const { field, text } of fields) {
        const terms = this.tokenize(text);
        for (const term of terms) {
          this.index.push({ requirementId: req.id, field, term });
          if (!seenTerms.has(term)) {
            seenTerms.add(term);
            this.termFrequency.set(term, (this.termFrequency.get(term) ?? 0) + 1);
          }
        }
      }
    }
  }

  /**
   * Search the index with a query string.
   * Returns results ranked by relevance (TF-IDF-like scoring).
   */
  search(query: string, limit = 50): SearchResult[] {
    const queryTerms = this.tokenize(query);
    if (queryTerms.length === 0) return [];

    const scores = new Map<string, { score: number; matches: Set<string> }>();

    for (const qTerm of queryTerms) {
      for (const entry of this.index) {
        if (entry.term.includes(qTerm) || qTerm.includes(entry.term)) {
          const exact = entry.term === qTerm;
          const idf = Math.log(
            (this.docCount + 1) / (1 + (this.termFrequency.get(entry.term) ?? 1)),
          );
          const fieldWeight = this.getFieldWeight(entry.field);
          const matchScore = (exact ? 2 : 1) * idf * fieldWeight;

          if (!scores.has(entry.requirementId)) {
            scores.set(entry.requirementId, { score: 0, matches: new Set() });
          }
          const record = scores.get(entry.requirementId)!;
          record.score += matchScore;
          record.matches.add(entry.field);
        }
      }
    }

    const results: SearchResult[] = [];
    for (const [requirementId, { score, matches }] of scores) {
      results.push({
        requirementId,
        score: Math.round(score * 100) / 100,
        matches: [...matches],
      });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  /**
   * Strip HTML tags from a string.
   */
  stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 1);
  }

  private getFieldWeight(field: string): number {
    switch (field) {
      case 'displayId':
        return 3;
      case 'title':
        return 2;
      case 'tags':
        return 1.5;
      case 'description':
        return 1;
      case 'owner':
        return 0.8;
      default:
        return 1;
    }
  }
}
