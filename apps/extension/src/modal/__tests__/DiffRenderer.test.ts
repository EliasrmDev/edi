// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { renderDiff, escapeHtml } from '../DiffRenderer';

describe('escapeHtml', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
    );
    expect(escapeHtml("it's a & test")).toBe("it&#39;s a &amp; test");
  });

  it('returns plain text unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });
});

describe('renderDiff', () => {
  // ── 1. Identical text ──────────────────────────────────────────────────────
  describe('identical text', () => {
    it('returns no <mark> tags when texts are equal', () => {
      const { originalHtml, transformedHtml } = renderDiff('Hola mundo', 'Hola mundo');
      expect(originalHtml).not.toContain('<mark');
      expect(transformedHtml).not.toContain('<mark');
    });

    it('returns escaped plain text for identical input', () => {
      const text = 'Hello <world> & friends';
      const { originalHtml, transformedHtml } = renderDiff(text, text);
      expect(originalHtml).toBe(escapeHtml(text));
      expect(transformedHtml).toBe(escapeHtml(text));
    });

    it('returns identical HTML strings for identical input', () => {
      const { originalHtml, transformedHtml } = renderDiff('foo bar', 'foo bar');
      expect(originalHtml).toBe(transformedHtml);
    });
  });

  // ── 2. Full replacement ────────────────────────────────────────────────────
  describe('full replacement', () => {
    it('marks entire original as deleted and entire transformed as added', () => {
      const { originalHtml, transformedHtml } = renderDiff('foo', 'bar');
      // All content in originalHtml should be inside diff-del marks
      expect(originalHtml).toContain('diff-del');
      expect(originalHtml).not.toContain('diff-add');
      // All content in transformedHtml should be inside diff-add marks
      expect(transformedHtml).toContain('diff-add');
      expect(transformedHtml).not.toContain('diff-del');
    });

    it('contains the original text inside diff-del', () => {
      const { originalHtml } = renderDiff('foo', 'bar');
      // Char-level diff marks each changed character; all of 'foo' must appear inside diff-del marks
      expect(originalHtml).toContain('class="diff-del"');
      // Strip tags — the plain text must equal 'foo'
      const text = originalHtml.replace(/<[^>]+>/g, '');
      expect(text).toBe('foo');
    });

    it('contains the transformed text inside diff-add', () => {
      const { transformedHtml } = renderDiff('foo', 'bar');
      // Char-level diff marks each changed character; all of 'bar' must appear inside diff-add marks
      expect(transformedHtml).toContain('class="diff-add"');
      // Strip tags — the plain text must equal 'bar'
      const text = transformedHtml.replace(/<[^>]+>/g, '');
      expect(text).toBe('bar');
    });

    it('handles multi-word full replacement', () => {
      const { originalHtml, transformedHtml } = renderDiff('one two three', 'four five six');
      expect(originalHtml).toContain('diff-del');
      expect(transformedHtml).toContain('diff-add');
      expect(originalHtml).not.toContain('diff-add');
      expect(transformedHtml).not.toContain('diff-del');
    });
  });

  // ── 3. Partial word change ─────────────────────────────────────────────────
  describe('partial word change', () => {
    it('leaves unchanged words without marks', () => {
      const { originalHtml, transformedHtml } = renderDiff('Hola mundo', 'Hola MUNDO');
      // "Hola" is unchanged — it should appear as plain text at the start (not inside a mark)
      expect(originalHtml).toMatch(/^Hola\s/);
      expect(transformedHtml).toMatch(/^Hola\s/);
    });

    it('marks only the changed word in original', () => {
      const { originalHtml } = renderDiff('Hola mundo', 'Hola MUNDO');
      expect(originalHtml).toContain('diff-del');
      expect(originalHtml).not.toContain('diff-add');
    });

    it('marks only the changed word in transformed', () => {
      const { transformedHtml } = renderDiff('Hola mundo', 'Hola MUNDO');
      expect(transformedHtml).toContain('diff-add');
      expect(transformedHtml).not.toContain('diff-del');
    });

    it('preserves unchanged prefix text verbatim', () => {
      const { originalHtml, transformedHtml } = renderDiff('El texto original', 'El texto cambiado');
      // "El texto " is unchanged
      expect(originalHtml).toContain('El texto');
      expect(transformedHtml).toContain('El texto');
    });

    it('applies char-level diff within changed word', () => {
      // "mundo" → "MUNDO": every char is different at char level
      const { originalHtml, transformedHtml } = renderDiff('Hola mundo', 'Hola MUNDO');
      // The changed portion in original should be marked del
      expect(originalHtml).toContain('class="diff-del"');
      // The changed portion in transformed should be marked add
      expect(transformedHtml).toContain('class="diff-add"');
    });
  });

  // ── 4. Whitespace-only change ──────────────────────────────────────────────
  describe('whitespace-only change', () => {
    it('marks extra whitespace as a change', () => {
      const { originalHtml, transformedHtml } = renderDiff('foo  bar', 'foo bar');
      // The extra space in original is marked as deleted
      expect(originalHtml).toContain('diff-del');
      // The single shared space is "equal" in the LCS — no diff-add is expected
      expect(transformedHtml).not.toContain('diff-del');
      expect(transformedHtml).not.toContain('diff-add');
    });

    it('preserves surrounding unchanged words without marks', () => {
      const { originalHtml, transformedHtml } = renderDiff('foo  bar', 'foo bar');
      expect(originalHtml).toContain('foo');
      expect(transformedHtml).toContain('foo');
      expect(originalHtml).toContain('bar');
      expect(transformedHtml).toContain('bar');
    });

    it('handles leading whitespace change', () => {
      const { originalHtml, transformedHtml } = renderDiff('  hello', ' hello');
      // Extra leading space in original is marked as deleted
      expect(originalHtml).toContain('diff-del');
      // The single shared leading space is "equal" — no diff marks in transformed
      expect(transformedHtml).not.toContain('diff-del');
      expect(transformedHtml).not.toContain('diff-add');
    });
  });

  // ── 5. Edge cases ──────────────────────────────────────────────────────────
  describe('edge cases', () => {
    it('handles empty original', () => {
      const { originalHtml, transformedHtml } = renderDiff('', 'hello');
      expect(originalHtml).toBe('');
      expect(transformedHtml).toContain('diff-add');
    });

    it('handles empty transformed', () => {
      const { originalHtml, transformedHtml } = renderDiff('hello', '');
      expect(originalHtml).toContain('diff-del');
      expect(transformedHtml).toBe('');
    });

    it('escapes HTML special characters in diff marks', () => {
      const { originalHtml, transformedHtml } = renderDiff('<b>old</b>', '<i>new</i>');
      // Tags should be escaped, not rendered as HTML
      expect(originalHtml).not.toContain('<b>');
      expect(transformedHtml).not.toContain('<i>');
      expect(originalHtml).toContain('&lt;');
      expect(transformedHtml).toContain('&lt;');
    });

    it('returns valid HTML structure (balanced marks)', () => {
      const { originalHtml, transformedHtml } = renderDiff('hello world', 'hello earth');
      // A simple structural check — every opening mark has a closing mark
      const countOpen = (html: string) => (html.match(/<mark /g) ?? []).length;
      const countClose = (html: string) => (html.match(/<\/mark>/g) ?? []).length;
      expect(countOpen(originalHtml)).toBe(countClose(originalHtml));
      expect(countOpen(transformedHtml)).toBe(countClose(transformedHtml));
    });
  });
});
