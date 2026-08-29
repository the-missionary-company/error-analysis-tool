export function shouldAutoScrollToComment(
  media: Pick<MediaQueryList, 'matches'> = window.matchMedia('(min-width: 1280px)'),
): boolean {
  return media.matches;
}
