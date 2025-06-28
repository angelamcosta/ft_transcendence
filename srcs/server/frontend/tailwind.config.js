export default {
  content: ["./public/*.html", "./public/*.js"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        background: 'var(--bg)',
        foreground: 'var(--fg)',
        border: 'var(--border)',
      }
    }
  },
  plugins: [],
}
