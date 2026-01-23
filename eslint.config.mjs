import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Custom rule overrides
  {
    rules: {
      // Allow setState in useEffect for hydration-safe patterns (SSR compatibility)
      "react-hooks/set-state-in-effect": "warn",
      // Allow <img> for external images (OpenWeatherMap icons)
      "@next/next/no-img-element": "warn",
    },
  },
]);

export default eslintConfig;
