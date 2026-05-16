import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        court: {
          blue: "#39a7ff",
          green: "#35f2a4",
          violet: "#9b7cff",
          amber: "#ffca6a",
          ink: "#0b1020",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      boxShadow: {
        glass: "0 24px 80px rgba(8, 13, 28, 0.18)",
        glow: "0 0 48px rgba(57, 167, 255, 0.28)",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(0.96)", opacity: "0.62" },
          "50%": { transform: "scale(1.02)", opacity: "1" },
          "100%": { transform: "scale(0.96)", opacity: "0.62" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-24%)" },
          "100%": { transform: "translateY(124%)" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 3.5s ease-in-out infinite",
        "scan-line": "scan-line 5s linear infinite",
      },
      backgroundImage: {
        "court-grid":
          "linear-gradient(to right, rgba(128, 143, 180, 0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(128, 143, 180, 0.12) 1px, transparent 1px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
