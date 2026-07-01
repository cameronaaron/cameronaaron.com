export const BUTTON_SPRING_CONFIG = {
  stiffness: 220,
  damping: 18,
  mass: 0.7,
} as const;

export const BUTTON_MAGNETIC_STRENGTH = 0.3;

export const BUTTON_BASE_STYLES =
  'font-semibold rounded-lg transition-all duration-300 inline-block text-center relative z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export const BUTTON_SIZE_STYLES = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-2 text-base',
  lg: 'px-8 py-4 text-base',
} as const;

export const BUTTON_VARIANT_STYLES = {
  primary: 'bg-gradient-to-r from-cyan-700 to-emerald-700 text-white shadow-lg hover:shadow-cyan-400/45',
  secondary: 'bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20',
  outline: 'border-2 border-cyan-400/70 text-cyan-300 hover:bg-cyan-400 hover:text-slate-950',
} as const;

export function getButtonStyles(
  size: keyof typeof BUTTON_SIZE_STYLES,
  variant: keyof typeof BUTTON_VARIANT_STYLES,
  className = ''
): string {
  return `${BUTTON_BASE_STYLES} ${BUTTON_SIZE_STYLES[size]} ${BUTTON_VARIANT_STYLES[variant]} ${className}`;
}
