export interface SocialPlatform {
  name: string;
  key: 'github' | 'linkedin';
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
] as const;
