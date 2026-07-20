export function toYouTubeEmbedUrl(url: string): string | undefined {
  const shortMatch = url.match(/^https?:\/\/youtu\.be\/([^?&/]+)/i);
  if (shortMatch?.[1]) return `https://www.youtube.com/embed/${shortMatch[1]}`;

  const longMatch = url.match(/[?&]v=([^?&]+)/i);
  if (longMatch?.[1]) return `https://www.youtube.com/embed/${longMatch[1]}`;

  return undefined;
}
