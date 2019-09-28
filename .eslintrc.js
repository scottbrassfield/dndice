module.exports = {
  parser: "babel-eslint",
  extends: ["eslint:recommended", "prettier"],
  plugins: ["import", "jest"],
  env: {
    "jest/globals": true,
    "node": true
  },
  rules: {
    "no-unused-vars": 1,
    "no-console": "warn"
  }
};