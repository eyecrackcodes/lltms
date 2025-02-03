module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: ["eslint:recommended", "google"],
  rules: {
    quotes: ["error", "double"],
    "max-len": ["error", { code: 120 }],
    "object-curly-spacing": ["error", "always"],
    indent: ["error", 2],
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
};
