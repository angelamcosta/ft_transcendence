export default {
  content: ["./public/*.html", "./public/*.js"],
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
