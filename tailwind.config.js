/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // All driven by CSS variables set on <html> by React (theme switching)
        bg:           'var(--bg)',
        surface:      'var(--surface)',
        surface2:     'var(--surface2)',
        'brd':        'var(--border)',
        ink:          'var(--ink)',
        'ink-mid':    'var(--ink-mid)',
        'ink-light':  'var(--ink-light)',
        accent:       'var(--accent)',
        'accent-soft':'var(--accent-soft)',
        'accent-pale':'var(--accent-pale)',
        highlight:    'var(--highlight)',
        'highlight-line': 'var(--highlight-line)',
        'textarea-bg':'var(--textarea-bg)',
      },
      fontFamily: {
        ui:     ['DM Sans', 'sans-serif'],
        active: ['var(--font-active)'],
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        popIn: {
          from: { opacity: '0', transform: 'translateY(-6px) scale(0.97)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        slideInUp: {
          from: { transform: 'translateY(110%)',  opacity: '0' },
          to:   { transform: 'translateY(0)',      opacity: '1' },
        },
        slideInDown: {
          from: { transform: 'translateY(-110%)', opacity: '0' },
          to:   { transform: 'translateY(0)',     opacity: '1' },
        },
      },
      animation: {
        popIn:       'popIn 0.18s ease',
        slideInUp:   'slideInUp 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        slideInDown: 'slideInDown 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards',
      },
    },
  },
  plugins: [],
}
