function isReplacementNode(node: Node): boolean {
  const el = node instanceof Element ? node : node.parentElement;
  return Boolean(el?.closest('[data-role="replacement"]'));
}

function originalOffset(root: HTMLElement, node: Node, nodeOffset: number): number | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let offset = 0;
  let current: Node | null;
  while ((current = walker.nextNode())) {
    if (isReplacementNode(current)) continue;
    if (current === node) return offset + nodeOffset;
    offset += current.textContent?.length ?? 0;
  }
  return null;
}

export function rangeOffsetsInRoot(
  root: HTMLElement,
  range: Range,
): { start: number; end: number; text: string } | null {
  const ancestor = range.commonAncestorContainer;
  if (ancestor !== root && !root.contains(ancestor)) return null;
  const start = originalOffset(root, range.startContainer, range.startOffset);
  const end = originalOffset(root, range.endContainer, range.endOffset);
  if (start === null || end === null) return null;
  const from = Math.min(start, end);
  const to = Math.max(start, end);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let text = '';
  let cursor = 0;
  let current: Node | null;
  while ((current = walker.nextNode())) {
    if (isReplacementNode(current)) continue;
    const value = current.textContent ?? '';
    const next = cursor + value.length;
    if (next > from && cursor < to) {
      text += value.slice(Math.max(0, from - cursor), Math.min(value.length, to - cursor));
    }
    cursor = next;
  }
  if (!text || !text.trim()) return null;
  return { start: from, end: to, text };
}
