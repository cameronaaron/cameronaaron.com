export const BUTTON_SPRING_CONFIG = {
  stiffness: 220,
  damping: 18,
  mass: 0.7,
} as const;

export const BUTTON_MAGNETIC_STRENGTH = 0.3;

export const BUTTON_BASE_STYLES =
  'font-semibold rounded-full transition-colors duration-200 inline-block text-center relative z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export const BUTTON_SIZE_STYLES = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-2.5 text-base',
  lg: 'px-8 py-3.5 text-base',
} as const;

export const BUTTON_VARIANT_STYLES = {
  primary: 'bg-primary text-primary-foreground hover:bg-secondary',
  secondary: 'bg-surface text-foreground border border-foreground/15 hover:border-foreground/45',
  outline: 'border border-primary/60 text-primary hover:bg-primary/10 hover:border-primary',
} as const;

export function getButtonStyles(
  size: keyof typeof BUTTON_SIZE_STYLES,
  variant: keyof typeof BUTTON_VARIANT_STYLES,
  className = ''
): string {
  return `${BUTTON_BASE_STYLES} ${BUTTON_SIZE_STYLES[size]} ${BUTTON_VARIANT_STYLES[variant]} ${className}`;
}
