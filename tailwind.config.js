// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./docs/**/*.js",
        "./docs/**/*.ts",
        "./docs/**/*.vue",
        "./docs/**/*.md",
        "./.vitepress/**/*.*",
    ],
    options: {
        safelist: ["html", "body"],
    },
};