import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        muted: "var(--muted)",
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          DEFAULT: "#4f46e5",
        },
        teal: {
          50: "#f0fdfa",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
        },
        primary: {
          DEFAULT: "var(--primary)",
          50: "#eef2ff",
          600: "#4f46e5",
          700: "#4338ca",
        },
        accent: "var(--accent)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        caption: ["0.75rem", { lineHeight: "1.1rem" }],
        body: ["0.875rem", { lineHeight: "1.35rem" }],
        subtitle: ["1rem", { lineHeight: "1.5rem", fontWeight: "600" }],
        title: ["1.25rem", { lineHeight: "1.75rem", fontWeight: "600" }],
        display: ["1.75rem", { lineHeight: "2.15rem", fontWeight: "600" }],
      },
      boxShadow: {
        card: "0 1px 2px rgb(15 23 42 / 0.05), 0 10px 28px -12px rgb(15 23 42 / 0.12)",
        lift: "0 8px 20px -8px rgb(79 70 229 / 0.35)",
        header: "0 8px 16px -12px rgb(15 23 42 / 0.18)",
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
      },
      spacing: {
        18: "4.5rem",
      },
    },
  },
  plugins: [],
};
export default config;
