/** Abstract base — all concrete handlers extend this. */
export abstract class TextFieldHandler {
  abstract getSelectedText(): string;
  /** Returns false if replacement failed; caller should fall back to clipboard. */
  abstract applyText(text: string): boolean;
}

// ── InputFieldHandler ─────────────────────────────────────────────────────────

/** Handles <input> and <textarea> elements. */
export class InputFieldHandler extends TextFieldHandler {
  constructor(private readonly element: HTMLInputElement | HTMLTextAreaElement) {
    super();
  }

  getSelectedText(): string {
    const { selectionStart, selectionEnd, value } = this.element;
    if (selectionStart === null || selectionEnd === null) return value;
    return value.slice(selectionStart, selectionEnd) || value;
  }

  applyText(text: string): boolean {
    try {
      const { selectionStart, selectionEnd, value } = this.element;

      if (
        selectionStart !== null &&
        selectionEnd !== null &&
        selectionStart !== selectionEnd
      ) {
        // Replace only selected portion
        const newValue = value.slice(0, selectionStart) + text + value.slice(selectionEnd);
        this.element.value = newValue;
        this.element.setSelectionRange(selectionStart, selectionStart + text.length);
      } else {
        // Replace full content
        this.element.value = text;
      }

      // Trigger React/Vue/Angular synthetic change detection
      this.element.dispatchEvent(new Event('input', { bubbles: true }));
      this.element.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    } catch {
      return false;
    }
  }
}

// ── ContentEditableHandler ────────────────────────────────────────────────────

/** Handles elements with contenteditable="true" or contenteditable="". */
export class ContentEditableHandler extends TextFieldHandler {
  private readonly savedRange: Range | null;

  constructor(
    private readonly element: HTMLElement,
    selection: Selection | null,
  ) {
    super();
    this.savedRange =
      selection && selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null;
  }

  getSelectedText(): string {
    return this.savedRange?.toString() ?? this.element.textContent ?? '';
  }

  applyText(text: string): boolean {
    try {
      if (!this.savedRange) return false;

      const selection = window.getSelection();
      if (!selection) return false;

      // Restore saved selection range
      selection.removeAllRanges();
      selection.addRange(this.savedRange);

      // Remove selected content
      this.savedRange.deleteContents();

      // Insert as plain text node — XSS-safe (no innerHTML)
      const textNode = document.createTextNode(text);
      this.savedRange.insertNode(textNode);

      // Move caret to end of inserted text
      const newRange = document.createRange();
      newRange.setStartAfter(textNode);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);

      this.element.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    } catch {
      return false;
    }
  }
}

// ── ReadOnlyHandler ───────────────────────────────────────────────────────────

/**
 * Fallback for text selected on non-editable elements.
 * applyText always returns false — the caller falls back to clipboard copy.
 */
export class ReadOnlyHandler extends TextFieldHandler {
  constructor(private readonly text: string) {
    super();
  }

  getSelectedText(): string {
    return this.text;
  }

  applyText(_text: string): boolean {
    return false; // Always triggers clipboard fallback
  }
}
