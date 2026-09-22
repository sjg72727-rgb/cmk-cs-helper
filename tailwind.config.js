/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cmk: {
          blue: "#0A2F6E",
          lightBlue: "#185ABD",
          accent: "#2D7FF9",
          bg: "#F8FAFC",
        },
      },
    },
  },
  plugins: [],
};
