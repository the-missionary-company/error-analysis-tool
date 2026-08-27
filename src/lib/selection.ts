export function rangeOffsetsInRoot(
  root: HTMLElement,
  range: Range,
): { start: number; end: number; text: string } | null {
  const ancestor = range.commonAncestorContainer;
  if (ancestor !== root && !root.contains(ancestor)) return null;
  const pre = document.createRange();
  pre.selectNodeContents(root);
  try {
    pre.setEnd(range.startContainer, range.startOffset);
  } catch {
    return null;
  }
  const start = pre.toString().length;
  const text = range.toString();
  if (!text || !text.trim()) return null;
  return { start, end: start + text.length, text };
}
