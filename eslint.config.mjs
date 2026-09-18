import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // The extension is plain browser scripts, outside the Next app entirely.
  // It is linted mainly for no-undef: these files never run during a build, so
  // a reference to a variable that no longer exists would otherwise only show
  // up as a broken autofill on a real application form.
  {
    files: ["chrome-extension/**/*.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "script",
      globals: {
        chrome: "readonly",
        globalThis: "readonly",
        window: "readonly",
        document: "readonly",
        location: "readonly",
        console: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        getComputedStyle: "readonly",
        MutationObserver: "readonly",
        CustomEvent: "readonly",
        Event: "readonly",
        InputEvent: "readonly",
        FocusEvent: "readonly",
        KeyboardEvent: "readonly",
        MouseEvent: "readonly",
        PointerEvent: "readonly",
        DragEvent: "readonly",
        DataTransfer: "readonly",
        HTMLInputElement: "readonly",
        CSS: "readonly",
        URL: "readonly",
      },
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
];

export default eslintConfig;
