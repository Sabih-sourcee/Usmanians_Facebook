/** @type {import('tailwindcss').Config} */
/** Usmanian Brand Guidelines v1.0 — keep in sync with src/index.css @theme */
module.exports = {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#0B6E3D",
        "primary-container": "#084D2A",
        "on-primary": "#FFFFFF",
        "on-primary-container": "#FFFFFF",
        "primary-fixed": "#D8F0E4",
        "primary-fixed-dim": "#A8D9C0",
        "on-primary-fixed": "#084D2A",
        "on-primary-fixed-variant": "#0B6E3D",
        "inverse-primary": "#7DCB9F",
        "surface-tint": "#0B6E3D",

        "secondary": "#8A6200",
        "secondary-container": "#D4A017",
        "on-secondary": "#FFFFFF",
        "on-secondary-container": "#1A1A1A",
        "secondary-fixed": "#F5E6B8",
        "secondary-fixed-dim": "#E8C96A",
        "on-secondary-fixed": "#8A6200",
        "on-secondary-fixed-variant": "#5C4300",

        "background": "#FAFAF8",
        "on-background": "#1A1A1A",
        "surface": "#FAFAF8",
        "surface-bright": "#FAFAF8",
        "surface-dim": "#F0F0EC",
        "surface-variant": "#E5E5E0",
        "surface-container-lowest": "#FFFFFF",
        "surface-container-low": "#F5F5F2",
        "surface-container": "#F0F0EC",
        "surface-container-high": "#EBEBE6",
        "surface-container-highest": "#E5E5E0",
        "on-surface": "#1A1A1A",
        "on-surface-variant": "#6B6B6B",
        "outline": "#6B6B6B",
        "outline-variant": "#E5E5E0",

        "error": "#C0392B",
        "on-error": "#FFFFFF",
        "error-container": "#FDE8E6",
        "on-error-container": "#8B1E14",

        "inverse-surface": "#1A1A1A",
        "inverse-on-surface": "#FAFAF8",

        "accent": "#0B6E3D",
        "accent-contrast": "#FFFFFF",
        "tertiary": "#0B6E3D",
        "on-tertiary": "#FFFFFF",
        "tertiary-container": "#084D2A",
        "on-tertiary-container": "#FFFFFF",
        "tertiary-fixed": "#F5E6B8",
        "tertiary-fixed-dim": "#D4A017",
        "on-tertiary-fixed": "#8A6200",
        "on-tertiary-fixed-variant": "#5C4300"
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "9999px"
      },
      maxWidth: {
        "xs": "20rem",
        "sm": "24rem",
        "md": "28rem",
        "lg": "32rem",
        "xl": "36rem",
        "2xl": "42rem",
        "3xl": "48rem"
      },
      fontFamily: {
        "headline-lg": ["Inter", "system-ui", "sans-serif"],
        "headline-xl": ["Inter", "system-ui", "sans-serif"],
        "body-lg": ["Inter", "system-ui", "sans-serif"],
        "body-md": ["Inter", "system-ui", "sans-serif"],
        "headline-lg-mobile": ["Inter", "system-ui", "sans-serif"],
        "headline-md": ["Inter", "system-ui", "sans-serif"],
        "label-md": ["Inter", "system-ui", "sans-serif"],
        "body-sm": ["Inter", "system-ui", "sans-serif"],
        "label-sm": ["Inter", "system-ui", "sans-serif"]
      }
    }
  }
};
