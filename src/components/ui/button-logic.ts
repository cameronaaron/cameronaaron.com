export const BUTTON_SPRING_CONFIG = {
  stiffness: 220,
  damping: 18,
  mass: 0.7,
} as const;

export const BUTTON_MAGNETIC_STRENGTH = 0.3;

export const BUTTON_BASE_STYLES =
  'font-semibold rounded-full transition-all duration-300 inline-block text-center relative z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export const BUTTON_SIZE_STYLES = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-2.5 text-base',
  lg: 'px-8 py-3.5 text-base',
} as const;

export const BUTTON_VARIANT_STYLES = {
  primary:
    'bg-gradient-to-b from-cyan-300 to-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/45 hover:from-cyan-200 hover:to-cyan-400',
  secondary:
    'bg-white/[0.06] backdrop-blur-sm text-white border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:border-cyan-300/40 hover:bg-white/[0.1]',
  outline: 'border border-cyan-300/60 text-cyan-200 hover:bg-cyan-300/10 hover:border-cyan-200',
} as const;

export function getButtonStyles(
  size: keyof typeof BUTTON_SIZE_STYLES,
  variant: keyof typeof BUTTON_VARIANT_STYLES,
  className = ''
): string {
  return `${BUTTON_BASE_STYLES} ${BUTTON_SIZE_STYLES[size]} ${BUTTON_VARIANT_STYLES[variant]} ${className}`;
}
