export default {
  content: ["./public/*.html", "./public/*.js"],
  safelist: [
    'bg-red-500','border-red-500',
    'bg-sky-500','border-sky-500',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        body: ['Roboto', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        primary: 'var(--primary)',
        background: 'var(--bg)',
        foreground: 'var(--fg)',
        border: 'var(--border)',
      }
    }
  },
  variants: ['responsive', 'dark'],
  plugins: [],
}
