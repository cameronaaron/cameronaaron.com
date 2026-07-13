export interface SocialPlatform {
  name: string;
  key: 'github' | 'linkedin' | 'spotify' | 'appleMusic';
  color: string;
}

export const socialPlatforms: readonly SocialPlatform[] = [
  {
    name: 'GitHub',
    key: 'github' as const,
    color: 'from-gray-700 to-gray-900'
  },
  {
    name: 'LinkedIn',
    key: 'linkedin' as const,
    color: 'from-blue-600 to-blue-800'
  },
  {
    name: 'Spotify',
    key: 'spotify' as const,
    color: 'from-green-500 to-green-700',
  },
  {
    name: 'Apple Music',
    key: 'appleMusic' as const,
    color: 'from-pink-500 to-rose-600',
  },
] as const;
