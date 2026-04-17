// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import {
  InputFieldHandler,
  ContentEditableHandler,
  ReadOnlyHandler,
} from '../TextFieldHandler.js';

// ---------------------------------------------------------------------------
// InputFieldHandler
// ---------------------------------------------------------------------------

describe('InputFieldHandler', () => {
  let input: HTMLInputElement;

  beforeEach(() => {
    input = document.createElement('input');
    input.type = 'text';
  });

  it('getSelectedText returns the selected portion', () => {
    input.value = 'hello world';
    input.setSelectionRange(6, 11); // selects "world"

    const handler = new InputFieldHandler(input);
    expect(handler.getSelectedText()).toBe('world');
  });

  it('getSelectedText returns full value when nothing is selected', () => {
    input.value = 'hello world';
    // setSelectionRange(0, 0) means nothing selected
    input.setSelectionRange(0, 0);

    const handler = new InputFieldHandler(input);
    // selectionStart === selectionEnd → falls back to full value
    expect(handler.getSelectedText()).toBe('hello world');
  });

  it('replaces only the selected portion', () => {
    input.value = 'hello world';
    input.setSelectionRange(6, 11); // "world"

    const handler = new InputFieldHandler(input);
    const result = handler.applyText('everyone');

    expect(result).toBe(true);
    expect(input.value).toBe('hello everyone');
  });

  it('replaces full content when nothing is selected', () => {
    input.value = 'hello world';
    input.setSelectionRange(0, 0); // nothing selected

    const handler = new InputFieldHandler(input);
    handler.applyText('goodbye');

    expect(input.value).toBe('goodbye');
  });

  it('dispatches an input event after applying text', () => {
    input.value = 'original';
    let inputEventFired = false;
    input.addEventListener('input', () => {
      inputEventFired = true;
    });

    const handler = new InputFieldHandler(input);
    handler.applyText('updated');

    expect(inputEventFired).toBe(true);
  });

  it('dispatches a change event after applying text', () => {
    input.value = 'original';
    let changeEventFired = false;
    input.addEventListener('change', () => {
      changeEventFired = true;
    });

    const handler = new InputFieldHandler(input);
    handler.applyText('updated');

    expect(changeEventFired).toBe(true);
  });

  it('applyText returns true on success', () => {
    input.value = 'test';
    const handler = new InputFieldHandler(input);
    expect(handler.applyText('new value')).toBe(true);
  });

  it('works with textarea elements', () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'multi\nline\ntext';
    textarea.setSelectionRange(6, 10); // "line"

    const handler = new InputFieldHandler(textarea);
    handler.applyText('paragraph');

    expect(textarea.value).toBe('multi\nparagraph\ntext');
  });
});

// ---------------------------------------------------------------------------
// ContentEditableHandler
// ---------------------------------------------------------------------------

describe('ContentEditableHandler', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  function createEditableDiv(content: string): HTMLDivElement {
    const div = document.createElement('div');
    div.contentEditable = 'true';
    div.textContent = content;
    document.body.appendChild(div);
    return div;
  }

  function selectText(
    container: HTMLElement,
    start: number,
    end: number,
  ): { sel: Selection; handler: ContentEditableHandler } {
    const range = document.createRange();
    const textNode = container.firstChild!;
    range.setStart(textNode, start);
    range.setEnd(textNode, end);

    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);

    return { sel, handler: new ContentEditableHandler(container, sel) };
  }

  it('getSelectedText returns the selected range text', () => {
    const div = createEditableDiv('hello world');
    const { handler } = selectText(div, 6, 11); // "world"

    expect(handler.getSelectedText()).toBe('world');
  });

  it('getSelectedText returns full textContent when selection is null', () => {
    const div = createEditableDiv('hello world');
    const handler = new ContentEditableHandler(div, null);

    expect(handler.getSelectedText()).toBe('hello world');
  });

  it('inserts text as a plain text node — not innerHTML', () => {
    const div = createEditableDiv('hello world');
    const { handler } = selectText(div, 6, 11); // select "world"

    const xssPayload = '<script>alert(1)</script>';
    const result = handler.applyText(xssPayload);

    expect(result).toBe(true);
    // No <script> element must exist in the DOM
    expect(document.querySelector('script')).toBeNull();
    // The angle brackets are stored as raw text (not executed as HTML)
    expect(div.textContent).toContain('<script>');
  });

  it('replaces selected text with the new content', () => {
    const div = createEditableDiv('hello world');
    const { handler } = selectText(div, 6, 11); // "world"

    handler.applyText('everyone');

    expect(div.textContent).toBe('hello everyone');
  });

  it('dispatches an input event after applying text', () => {
    const div = createEditableDiv('hello world');
    let fired = false;
    div.addEventListener('input', () => {
      fired = true;
    });

    const { handler } = selectText(div, 0, 5); // "hello"
    handler.applyText('goodbye');

    expect(fired).toBe(true);
  });

  it('returns false when savedRange is null', () => {
    const div = createEditableDiv('hello world');
    const handler = new ContentEditableHandler(div, null);

    expect(handler.applyText('anything')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ReadOnlyHandler
// ---------------------------------------------------------------------------

describe('ReadOnlyHandler', () => {
  it('getSelectedText returns the text provided at construction', () => {
    const handler = new ReadOnlyHandler('the selected text');
    expect(handler.getSelectedText()).toBe('the selected text');
  });

  it('applyText always returns false', () => {
    const handler = new ReadOnlyHandler('anything');
    expect(handler.applyText('new text')).toBe(false);
  });

  it('applyText returns false regardless of what text is passed', () => {
    const handler = new ReadOnlyHandler('text');
    expect(handler.applyText('')).toBe(false);
    expect(handler.applyText('some content')).toBe(false);
    expect(handler.applyText('<script>xss</script>')).toBe(false);
  });
});
