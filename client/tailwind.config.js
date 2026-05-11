/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        academic: {
          ink: "#12211c",
          navy: "#16352f",
          blue: "#315b67",
          teal: "#1f6f55",
          gold: "#d6a23a",
          terracotta: "#9f3c2f",
          cream: "#f6f0e4",
          leaf: "#2f6b45"
        }
      },
      boxShadow: {
        glass: "0 24px 80px rgba(7, 17, 34, 0.22)"
      }
    }
  },
  plugins: []
};
