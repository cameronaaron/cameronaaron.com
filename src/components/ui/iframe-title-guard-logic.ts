export function inferIframeTitle(iframe: HTMLIFrameElement): string {
  const width = Number(iframe.getAttribute('width') ?? iframe.clientWidth ?? 0);
  const height = Number(iframe.getAttribute('height') ?? iframe.clientHeight ?? 0);
  const style = (iframe.getAttribute('style') ?? '').toLowerCase();

  const isLikelyHiddenTrackingFrame =
    width <= 1 &&
    height <= 1 &&
    (style.includes('visibility: hidden') || style.includes('display: none') || style.includes('opacity: 0'));

  if (isLikelyHiddenTrackingFrame) {
    return 'Hidden tracking frame';
  }

  const src = iframe.getAttribute('src');
  if (!src) {
    return 'Embedded content frame';
  }

  try {
    const url = new URL(src, window.location.origin);
    return `Embedded content from ${url.hostname}`;
  } catch {
    return 'Embedded content frame';
  }
}

export function ensureIframeAccessibleTitle(iframe: HTMLIFrameElement): void {
  const currentTitle = iframe.getAttribute('title');
  if (currentTitle && currentTitle.trim().length > 0) {
    return;
  }

  iframe.setAttribute('title', inferIframeTitle(iframe));
}
