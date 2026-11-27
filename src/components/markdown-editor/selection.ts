// The selection of the markdown editor's textarea, and the edits of its buttons. Every change of the text is passed
// to onInput.
export default class Selection {
  constructor(
    private textarea: HTMLTextAreaElement,
    private onInput: (value: string) => void
  ) {}

  get start() {
    return this.textarea.selectionStart;
  }

  set start(value: number) {
    this.textarea.selectionStart = value;
  }

  get end() {
    return this.textarea.selectionEnd;
  }

  set end(value: number) {
    this.textarea.selectionEnd = value;
  }

  get length() {
    return this.end - this.start;
  }

  get text() {
    return this.textarea.value.substr(this.start, this.length);
  }

  get isEmpty() {
    return this.start === this.end;
  }

  set(start: number, end?: number) {
    this.start = start;
    this.end = end ?? start;
  }

  // TODO : remove before and after, and rewite calls with f-strings
  setText(text: string, before = '', after = '') {
    const chunk = before + text + after;

    const start = this.start;
    this.textarea.value =
      this.textarea.value.substr(0, this.start) +
      chunk +
      this.textarea.value.substr(this.end, this.textarea.value.length);
    this.set(start + before.length, start + before.length + text.length);

    this.onInput(this.textarea.value);
  }

  replace(pattern: RegExp, replacement: string) {
    this.setText(this.text.replace(pattern, replacement));
  }

  isSurroundedBy(before: string, after: string) {
    const beforeLength = before.length;
    const afterLength = after.length;
    const content = this.textarea.value;

    return (
      content.substr(this.start - beforeLength, beforeLength) === before &&
      content.substr(this.end, afterLength) === after
    );
  }

  expandToEntireLine() {
    const start = this.textarea.value.lastIndexOf('\n', this.start);
    this.start = start + 1;
    const end = this.textarea.value.indexOf('\n', this.end);
    this.end = end === -1 ? this.textarea.value.length : end;
  }

  linesStartsWith(tag: string) {
    for (const line of this.text.split('\n')) {
      if (!line.startsWith(tag)) {
        return false;
      }
    }

    return true;
  }

  removeLinePrefix(tag: string) {
    this.setText(
      this.text
        .split('\n')
        .map((line) => line.substr(tag.length))
        .join('\n')
    );
  }

  addLinePrefix(tag: string) {
    this.setText(
      this.text
        .split('\n')
        .map((line) => tag + line)
        .join('\n')
    );
  }
}
