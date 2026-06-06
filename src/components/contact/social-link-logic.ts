export type SocialPlatformKey = 'github' | 'linkedin';

export function getSocialRevealRange(index: number): { start: number; end: number } {
  const start = 0.08 + index * 0.16;
  const end = start + 0.4;

  return { start, end };
}

export function getSocialPlatformIconPath(platformKey: SocialPlatformKey): string {
  if (platformKey === 'linkedin') {
    return 'M6.94 8.5a1.56 1.56 0 1 1 0-3.12 1.56 1.56 0 0 1 0 3.12ZM5.6 19.2h2.67V9.45H5.6V19.2Zm4.18 0h2.56v-4.84c0-1.28.24-2.51 1.83-2.51 1.56 0 1.58 1.46 1.58 2.59v4.76H18.3v-5.3c0-2.6-.56-4.6-3.6-4.6-1.46 0-2.44.8-2.84 1.56h-.04V9.45H9.78c.03.85 0 9.75 0 9.75Z';
  }

  return 'M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.2.8-.6v-2.2c-3.4.8-4.1-1.6-4.1-1.6-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6A4.7 4.7 0 0 1 6.7 8c-.1-.3-.6-1.5.1-3.2 0 0 1-.3 3.3 1.3a11.4 11.4 0 0 1 6 0c2.3-1.6 3.3-1.3 3.3-1.3.7 1.7.2 2.9.1 3.2a4.7 4.7 0 0 1 1.3 3.3c0 4.7-2.8 5.7-5.5 6 .4.3.8 1 .8 2v2.9c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z';
}
