/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Minecraft/Pixel Art inspired color palette
        primary: {
          50: "#e8f5e8",
          100: "#c8e6c8",
          200: "#a8d7a8",
          300: "#88c888",
          400: "#68b968",
          500: "#48aa48", // Main green
          600: "#3a8a3a",
          700: "#2c6a2c",
          800: "#1e4a1e",
          900: "#102a10",
        },
        secondary: {
          50: "#f0f8ff",
          100: "#e0f0ff",
          200: "#c0e0ff",
          300: "#a0d0ff",
          400: "#80c0ff",
          500: "#60b0ff", // Sky blue
          600: "#4d8ccc",
          700: "#3a6899",
          800: "#274466",
          900: "#142033",
        },
        accent: {
          50: "#fff8e1",
          100: "#ffecb3",
          200: "#ffe082",
          300: "#ffd54f",
          400: "#ffca28",
          500: "#ffc107", // Gold
          600: "#ffb300",
          700: "#ffa000",
          800: "#ff8f00",
          900: "#ff6f00",
        },
        earth: {
          50: "#f5f5dc",
          100: "#e8e8b8",
          200: "#d4d494",
          300: "#c0c070",
          400: "#acac4c",
          500: "#989828", // Earth brown
          600: "#7a7a20",
          700: "#5c5c18",
          800: "#3e3e10",
          900: "#202008",
        },
        stone: {
          50: "#f8f8f8",
          100: "#e8e8e8",
          200: "#d0d0d0",
          300: "#b8b8b8",
          400: "#a0a0a0",
          500: "#888888", // Stone gray
          600: "#6d6d6d",
          700: "#525252",
          800: "#373737",
          900: "#1c1c1c",
        },
        danger: {
          50: "#ffeaea",
          100: "#ffd5d5",
          200: "#ffb3b3",
          300: "#ff9191",
          400: "#ff6f6f",
          500: "#ff4d4d", // Red
          600: "#cc3e3e",
          700: "#992e2e",
          800: "#661f1f",
          900: "#330f0f",
        },
        success: {
          50: "#e8f5e8",
          100: "#c8e6c8",
          200: "#a8d7a8",
          300: "#88c888",
          400: "#68b968",
          500: "#48aa48", // Green
          600: "#3a8a3a",
          700: "#2c6a2c",
          800: "#1e4a1e",
          900: "#102a10",
        },
        warning: {
          50: "#fff8e1",
          100: "#ffecb3",
          200: "#ffe082",
          300: "#ffd54f",
          400: "#ffca28",
          500: "#ffc107", // Orange
          600: "#ffb300",
          700: "#ffa000",
          800: "#ff8f00",
          900: "#ff6f00",
        },
        info: {
          50: "#e3f2fd",
          100: "#bbdefb",
          200: "#90caf9",
          300: "#64b5f6",
          400: "#42a5f5",
          500: "#2196f3", // Blue
          600: "#1e88e5",
          700: "#1976d2",
          800: "#1565c0",
          900: "#0d47a1",
        },
      },
      fontFamily: {
        bmjua: ["BMJUA"],
        pixel: ["Press Start 2P", "monospace"],
        minecraft: ["Minecraft", "monospace"],
        sans: ["BMJUA", "Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "pixel-bounce": "pixel-bounce 0.6s ease-in-out",
        "pixel-fade-in": "pixel-fade-in 0.5s ease-out",
        "pixel-slide-up": "pixel-slide-up 0.4s ease-out",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        "pixel-bounce": {
          "0%, 20%, 53%, 80%, 100": {
            transform: "translate3d(0,0,0)",
          },
          "40%, 43%": {
            transform: "translate3d(0, -8px, 0)",
          },
          "70%": {
            transform: "translate3d(0, -4px, 0)",
          },
          "90%": {
            transform: "translate3d(0, -2px, 0)",
          },
        },
        "pixel-fade-in": {
          "0%": {
            opacity: "0",
            transform: "scale(0.95)",
          },
          "100%": {
            opacity: "1",
            transform: "scale(1)",
          },
        },
        "pixel-slide-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        glow: {
          "0%": {
            boxShadow: "0 0 5px #48aa48, 0 0 10px #48aa48, 0 0 15px #48aa48",
          },
          "100%": {
            boxShadow: "0 0 10px #48aa48, 0 0 20px #48aa48, 0 0 30px #48aa48",
          },
        },
      },
      boxShadow: {
        pixel: "4px 4px 0px rgba(0, 0, 0, 0.3)",
        "pixel-lg": "8px 8px 0px rgba(0, 0, 0, 0.3)",
        "pixel-inset": "inset 2px 2px 0px rgba(0, 0, 0, 0.2)",
      },
      borderWidth: {
        3: "3px",
        4: "4px",
      },
      borderRadius: {
        pixel: "4px",
        "pixel-lg": "8px",
      },
    },
  },
  plugins: [],
};
