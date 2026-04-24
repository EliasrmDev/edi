/**
 * DiffRenderer — pure diff engine for the Visual Diff Panel.
 *
 * Computes a word-level LCS between `original` and `transformed`, then for any
 * changed word segments applies a char-level LCS to produce fine-grained
 * character highlighting.
 *
 * XSS safety: all user text is passed through `escapeHtml` before being
 * placed into the returned HTML string. Only trusted `<mark>` wrappers are
 * injected by this module.
 *
 * This module has NO DOM access and is safe to run in Node/vitest.
 */

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── LCS core ─────────────────────────────────────────────────────────────────

/**
 * Returns the length table for the Longest Common Subsequence of two arrays.
 * `eq` is a custom equality comparator to support both string[] and string
 * element comparison.
 */
function lcsTable<T>(a: T[], b: T[], eq: (x: T, y: T) => boolean): number[][] {
  const m = a.length;
  const n = b.length;
  // Allocate (m+1) × (n+1) table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (eq(a[i - 1]!, b[j - 1]!)) {
        dp[i]![j] = dp[i - 1]![j - 1]! + 1;
      } else {
        dp[i]![j] = Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
      }
    }
  }
  return dp;
}

type DiffOp = { op: 'equal' | 'delete' | 'insert'; value: string };

/**
 * Backtrack the LCS table to produce a sequence of equal/delete/insert ops.
 */
function backtrack<T>(
  dp: number[][],
  a: T[],
  b: T[],
  eq: (x: T, y: T) => boolean,
  toString: (v: T) => string,
): DiffOp[] {
  const ops: DiffOp[] = [];
  let i = a.length;
  let j = b.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && eq(a[i - 1]!, b[j - 1]!)) {
      ops.push({ op: 'equal', value: toString(a[i - 1]!) });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i]![j - 1]! >= dp[i - 1]![j]!)) {
      ops.push({ op: 'insert', value: toString(b[j - 1]!) });
      j--;
    } else {
      ops.push({ op: 'delete', value: toString(a[i - 1]!) });
      i--;
    }
  }

  return ops.reverse();
}

// ── Char-level diff ───────────────────────────────────────────────────────────

/**
 * Produces HTML for a char-level diff between two strings.
 * Deleted chars are wrapped in `.diff-del`, added chars in `.diff-add`.
 * Returns `{ originalHtml, transformedHtml }` covering only this segment.
 */
function charDiff(
  original: string,
  transformed: string,
): { originalHtml: string; transformedHtml: string } {
  const a = original.split('');
  const b = transformed.split('');
  const dp = lcsTable(a, b, (x, y) => x === y);
  const ops = backtrack(dp, a, b, (x, y) => x === y, (v) => v);

  let origHtml = '';
  let transHtml = '';

  for (const { op, value } of ops) {
    const escaped = escapeHtml(value);
    if (op === 'equal') {
      origHtml += escaped;
      transHtml += escaped;
    } else if (op === 'delete') {
      origHtml += `<mark class="diff-del">${escaped}</mark>`;
    } else {
      transHtml += `<mark class="diff-add">${escaped}</mark>`;
    }
  }

  return { originalHtml: origHtml, transformedHtml: transHtml };
}

// ── Token helpers ─────────────────────────────────────────────────────────────

/**
 * Splits text into alternating word/whitespace tokens so that whitespace is
 * preserved and also diffed.  For example "foo  bar" →
 * ["foo", "  ", "bar"].
 */
function tokenize(text: string): string[] {
  // Split on whitespace boundaries while keeping the delimiters
  return text.split(/(\s+)/).filter((t) => t.length > 0);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Computes a word-level diff between `original` and `transformed`.
 * Within each changed segment a char-level diff is applied.
 *
 * Returns an object with two HTML strings safe for `innerHTML`:
 *   - `originalHtml`   — original text with deletions marked with `.diff-del`
 *   - `transformedHtml` — transformed text with additions marked with `.diff-add`
 *
 * If `original === transformed`, returns plain escaped text with no marks.
 */
export function renderDiff(
  original: string,
  transformed: string,
): { originalHtml: string; transformedHtml: string } {
  if (original === transformed) {
    const escaped = escapeHtml(original);
    return { originalHtml: escaped, transformedHtml: escaped };
  }

  const a = tokenize(original);
  const b = tokenize(transformed);
  const dp = lcsTable(a, b, (x, y) => x === y);
  const ops = backtrack(dp, a, b, (x, y) => x === y, (v) => v);

  // Merge consecutive delete/insert pairs so char-diff works on whole changed
  // words rather than isolated tokens.
  const merged: DiffOp[] = [];
  for (const op of ops) {
    const last = merged[merged.length - 1];
    if (
      last &&
      ((last.op === 'delete' && op.op === 'insert') ||
        (last.op === 'insert' && op.op === 'delete'))
    ) {
      // Combine into a replace pair — push as two separate entries grouped
      merged.push(op);
    } else if (last && last.op === op.op && op.op !== 'equal') {
      // Accumulate consecutive same-type ops (e.g. multiple inserts)
      last.value += op.value;
    } else {
      merged.push({ ...op });
    }
  }

  let origHtml = '';
  let transHtml = '';
  let i = 0;

  while (i < merged.length) {
    const cur = merged[i]!;

    if (cur.op === 'equal') {
      const escaped = escapeHtml(cur.value);
      origHtml += escaped;
      transHtml += escaped;
      i++;
      continue;
    }

    // Collect a run of deletes followed by inserts (a "replacement block")
    let deletedText = '';
    let insertedText = '';

    while (i < merged.length && merged[i]!.op === 'delete') {
      deletedText += merged[i]!.value;
      i++;
    }
    while (i < merged.length && merged[i]!.op === 'insert') {
      insertedText += merged[i]!.value;
      i++;
    }

    if (deletedText && insertedText) {
      // Replacement — apply char-level diff for fine-grained highlighting
      const { originalHtml: oh, transformedHtml: th } = charDiff(deletedText, insertedText);
      origHtml += oh;
      transHtml += th;
    } else if (deletedText) {
      // Pure deletion
      origHtml += `<mark class="diff-del">${escapeHtml(deletedText)}</mark>`;
    } else if (insertedText) {
      // Pure insertion
      transHtml += `<mark class="diff-add">${escapeHtml(insertedText)}</mark>`;
    }
  }

  return { originalHtml: origHtml, transformedHtml: transHtml };
}
