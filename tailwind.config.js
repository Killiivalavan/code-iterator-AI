/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3B82F6",
        secondary: "#10B981",
        background: "#1E293B",
        editor: "#111827",
        diff: {
          add: "#064E3B",
          remove: "#7F1D1D",
        },
      },
    },
  },
  plugins: [],
}; 