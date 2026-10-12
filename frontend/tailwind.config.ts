import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FAFAF8",
        surface: "#FFFFFF",
        brand: {
          50: "#FFF5F4",
          100: "#FFEBE8",
          200: "#FFD6D0",
          500: "#F97362",
          600: "#E85E4D",
          700: "#D34938",
        },
        primary: {
          50: "#EEF2FF",
          500: "#4F46E5",
          600: "#4338CA",
        },
        ink: {
          900: "#1A1A1A",
          700: "#374151",
          500: "#6B7280",
          300: "#D1D5DB",
          100: "#F3F4F6",
        },
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
      },
      boxShadow: {
        soft: "0 2px 14px rgba(0, 0, 0, 0.05)",
        "soft-lg": "0 10px 30px -4px rgba(0, 0, 0, 0.08)",
        "glow-brand": "0 0 20px rgba(249, 115, 98, 0.25)",
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Roboto", "sans-serif"],
        heading: ['"Poppins"', '"Inter"', "system-ui", "sans-serif"],
        display: ['"Poppins"', '"Inter"', "system-ui", "sans-serif"],
        serif: ['"Poppins"', '"Inter"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
