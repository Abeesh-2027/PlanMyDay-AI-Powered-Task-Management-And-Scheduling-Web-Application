/** Every color is a CSS variable (see src/styles/index.css) so light and dark themes share one
 *  design system. SOLID COLORS ONLY: no gradients anywhere in the app. */
const c = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'] },
      colors: {
        // surfaces and text
        bg: c('bg'),
        card: c('card'),
        subtle: c('subtle'),
        line: c('line'),
        ink: c('ink'),
        muted: c('muted'),
        // brand
        primary: c('primary'),
        'primary-soft': c('primary-soft'),
        'primary-ink': c('primary-ink'),
        navy: c('navy'),
        accent: c('accent'),
        'accent-soft': c('accent-soft'),
        'accent-ink': c('accent-ink'),
        // status
        success: c('success'),
        'success-soft': c('success-soft'),
        'success-ink': c('success-ink'),
        warning: c('warning'),
        'warning-soft': c('warning-soft'),
        'warning-ink': c('warning-ink'),
        danger: c('danger'),
        'danger-soft': c('danger-soft'),
        'danger-ink': c('danger-ink'),
      },
      borderRadius: { xl: '12px', '2xl': '16px' },
      boxShadow: {
        card: '0 1px 2px rgb(15 23 42 / 0.04), 0 4px 14px rgb(15 23 42 / 0.05)',
        pop: '0 12px 32px rgb(15 23 42 / 0.16)',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'slide-up': { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        'scale-in': { from: { opacity: 0, transform: 'scale(0.96)' }, to: { opacity: 1, transform: 'scale(1)' } },
      },
      animation: {
        'fade-in': 'fade-in .18s ease-out',
        'slide-up': 'slide-up .22s ease-out',
        'scale-in': 'scale-in .14s ease-out',
      },
    },
  },
  plugins: [],
};
