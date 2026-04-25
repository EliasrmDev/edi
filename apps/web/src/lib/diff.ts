/**
 * Pure LCS-based diff engine (word-level + char-level).
 * No DOM access — safe for SSR/Node.
 */

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function unescapeHtml(html: string): string {
  return html
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');
}

// ── LCS core ──────────────────────────────────────────────────────────────────

function lcsTable(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i]![j] = a[i - 1] === b[j - 1] ? dp[i - 1]![j - 1]! + 1 : Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
    }
  }
  return dp;
}

type Op = { type: 'eq' | 'del' | 'ins'; value: string };

function backtrack(dp: number[][], a: string[], b: string[], i: number, j: number): Op[] {
  if (i === 0 && j === 0) return [];
  if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
    return [...backtrack(dp, a, b, i - 1, j - 1), { type: 'eq', value: a[i - 1]! }];
  }
  if (j > 0 && (i === 0 || dp[i]![j - 1]! >= dp[i - 1]![j]!)) {
    return [...backtrack(dp, a, b, i, j - 1), { type: 'ins', value: b[j - 1]! }];
  }
  return [...backtrack(dp, a, b, i - 1, j), { type: 'del', value: a[i - 1]! }];
}

// ── Char-level diff ───────────────────────────────────────────────────────────

function charDiff(
  origWord: string,
  transWord: string,
): { origHtml: string; transHtml: string } {
  const origChars = [...origWord];
  const transChars = [...transWord];
  const dp = lcsTable(origChars, transChars);
  const ops = backtrack(dp, origChars, transChars, origChars.length, transChars.length);

  let origHtml = '';
  let transHtml = '';
  for (const op of ops) {
    const escaped = escapeHtml(op.value);
    if (op.type === 'eq') {
      origHtml += escaped;
      transHtml += escaped;
    } else if (op.type === 'del') {
      origHtml += `<mark class="diff-del">${escaped}</mark>`;
    } else {
      transHtml += `<mark class="diff-add">${escaped}</mark>`;
    }
  }
  return { origHtml, transHtml };
}

// ── Word tokenizer ────────────────────────────────────────────────────────────

function tokenize(text: string): string[] {
  return text.split(/(\s+)/).filter((t) => t.length > 0);
}

// ── Public API ────────────────────────────────────────────────────────────────

export function renderDiff(
  original: string,
  transformed: string,
): { originalHtml: string; transformedHtml: string } {
  if (original === transformed) {
    const html = escapeHtml(original);
    return { originalHtml: html, transformedHtml: html };
  }

  const origTokens = tokenize(original);
  const transTokens = tokenize(transformed);
  const dp = lcsTable(origTokens, transTokens);
  const ops = backtrack(dp, origTokens, transTokens, origTokens.length, transTokens.length);

  let _originalHtml = '';
  let _transformedHtml = '';

  for (const op of ops) {
    if (op.type === 'eq') {
      const escaped = escapeHtml(op.value);
      _originalHtml += escaped;
      _transformedHtml += escaped;
    } else if (op.type === 'del') {
      _originalHtml += `<mark class="diff-del">${escapeHtml(op.value)}</mark>`;
    } else if (op.type === 'ins') {
      _transformedHtml += `<mark class="diff-add">${escapeHtml(op.value)}</mark>`;
    }
  }

  // Upgrade adjacent del+ins pairs for the same position to char-level diff
  // (simple post-process: find consecutive del/ins tokens of similar size)
  const result = upgradeCharDiff(ops);
  return result;
}

function upgradeCharDiff(
  ops: Op[],
): { originalHtml: string; transformedHtml: string } {
  let originalHtml = '';
  let transformedHtml = '';
  let i = 0;

  while (i < ops.length) {
    const op = ops[i]!;
    if (
      op.type === 'del' &&
      i + 1 < ops.length &&
      ops[i + 1]!.type === 'ins' &&
      !/^\s+$/.test(op.value)
    ) {
      // Adjacent del+ins → char-level diff
      const { origHtml, transHtml } = charDiff(op.value, ops[i + 1]!.value);
      originalHtml += origHtml;
      transformedHtml += transHtml;
      i += 2;
    } else if (op.type === 'eq') {
      const escaped = escapeHtml(op.value);
      originalHtml += escaped;
      transformedHtml += escaped;
      i++;
    } else if (op.type === 'del') {
      originalHtml += `<mark class="diff-del">${escapeHtml(op.value)}</mark>`;
      i++;
    } else {
      transformedHtml += `<mark class="diff-add">${escapeHtml(op.value)}</mark>`;
      i++;
    }
  }

  return { originalHtml, transformedHtml };
}

// ── Char token parser (for typewriter animation) ──────────────────────────────

export type CharToken = { char: string; cls: 'diff-del' | 'diff-add' | null };

export function parseHtmlToCharTokens(html: string): CharToken[] {
  const tokens: CharToken[] = [];
  const markRe = /<mark class="(diff-del|diff-add)">([\s\S]*?)<\/mark>|([^<]+)/g;
  let match: RegExpExecArray | null;
  while ((match = markRe.exec(html)) !== null) {
    if (match[3] !== undefined) {
      // Plain text
      const text = unescapeHtml(match[3]);
      for (const ch of text) {
        tokens.push({ char: ch, cls: null });
      }
    } else {
      const cls = match[1] as 'diff-del' | 'diff-add';
      const text = unescapeHtml(match[2]!);
      for (const ch of text) {
        tokens.push({ char: ch, cls });
      }
    }
  }
  return tokens;
}
