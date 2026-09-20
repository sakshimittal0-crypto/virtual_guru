/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Placeholder palette — swap for real brand colors whenever
        // someone picks them. Warm/maroon nods to the Indian classical
        // music setting without committing to a final design system.
        saffron: "#E08A2B",
        maroon: "#6B1E23",
        cream: "#FBF6EE",
      },
    },
  },
  plugins: [],
};
