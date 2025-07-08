import type { Config } from "tailwindcss";

export default {
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
        primary: {
          DEFAULT: "#1a1a1a",
          50: "#f8f9fa",
          100: "#f1f3f4",
          900: "#1a1a1a",
        },
        accent: {
          DEFAULT: "#0066ff",
          50: "#eff6ff",
          500: "#0066ff",
        },
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
        muted: {
          DEFAULT: "#6b7280",
          foreground: "#9ca3af",
        },
        border: "#e5e7eb",
        surface: "#f8f9fa",
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'large': '0 8px 24px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
} satisfies Config;