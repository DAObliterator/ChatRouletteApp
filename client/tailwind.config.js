/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg1: "black",
        bg2: "rgb(203 213 225)",
        bg3: "rgb(31 41 55)",
        txt1: "rgb(5 150 105)",
        txt2: "red"
      },
    },
  },
  plugins: [],
};

