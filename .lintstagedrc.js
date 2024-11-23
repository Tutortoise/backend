module.exports = {
  "src/**/*.{js,ts}": (filenames) => [
    `prettier --write ${filenames.join(" ")}`,
  ],
  "tests/**/*.{js,ts}": (filenames) => [
    `prettier --write ${filenames.join(" ")}`,
    // `NODE_ENV=test vitest related ${filenames.join(" ")} --run`,
  ],
  "*.{js,ts,json,md}": ["prettier --write"],
};
