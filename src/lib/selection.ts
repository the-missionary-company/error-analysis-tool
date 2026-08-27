function isReplacementNode(node: Node): boolean {
  const el = node instanceof Element ? node : node.parentElement;
  return Boolean(el?.closest('[data-role="replacement"]'));
}

function mappedHost(root: HTMLElement, node: Node): HTMLElement | null {
  const el = node instanceof Element ? node : node.parentElement;
  const host = el?.closest('[data-src-start]') as HTMLElement | null;
  if (!host || !root.contains(host) || host.dataset.srcStart == null) return null;
  return host;
}

function textNodeSourceOffset(root: HTMLElement, node: Node, nodeOffset: number): number | null {
  if (isReplacementNode(node)) return null;
  const host = mappedHost(root, node);
  if (host) {
    const srcStart = Number(host.dataset.srcStart);
    if (Number.isFinite(srcStart)) return srcStart + nodeOffset;
  }
  return walkedOffset(root, node, nodeOffset);
}

function walkedOffset(root: HTMLElement, node: Node, nodeOffset: number): number | null {
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

function firstTextNode(node: Node): Text | null {
  if (node.nodeType === Node.TEXT_NODE) return node as Text;
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  return walker.nextNode() as Text | null;
}

function lastTextNode(node: Node): Text | null {
  if (node.nodeType === Node.TEXT_NODE) return node as Text;
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  let last: Text | null = null;
  let current: Node | null;
  while ((current = walker.nextNode())) last = current as Text;
  return last;
}

function boundarySourceOffset(root: HTMLElement, node: Node, nodeOffset: number): number | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return textNodeSourceOffset(root, node, nodeOffset);
  }
  if (node.nodeType !== Node.ELEMENT_NODE && node !== root) return null;
  const el = node as Element;
  if (nodeOffset < el.childNodes.length) {
    const child = el.childNodes[nodeOffset];
    const text = firstTextNode(child);
    if (text) return textNodeSourceOffset(root, text, 0);
    return boundarySourceOffset(root, child, 0);
  }
  const last = lastTextNode(el);
  if (last) return textNodeSourceOffset(root, last, last.textContent?.length ?? 0);
  return null;
}

export function rangeOffsetsInRoot(
  root: HTMLElement,
  range: Range,
): { start: number; end: number; text: string } | null {
  const ancestor = range.commonAncestorContainer;
  if (ancestor !== root && !root.contains(ancestor)) return null;
  const start = boundarySourceOffset(root, range.startContainer, range.startOffset);
  const end = boundarySourceOffset(root, range.endContainer, range.endOffset);
  if (start === null || end === null) return null;
  const from = Math.min(start, end);
  const to = Math.max(start, end);
  const displayed = range.toString();
  if (!displayed.trim()) return null;
  return { start: from, end: to, text: displayed };
}
