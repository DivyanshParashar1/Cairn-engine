import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/node_modules/**"],
  },
  js.configs.recommended,
  // recommendedTypeChecked is what makes `any` a build failure rather than a
  // style note: it needs type information, hence projectService below.
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            "packages/engine/test/*.ts",
            "packages/engine/test/support/*.ts",
            "packages/engine/vitest.config.ts",
          ],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // This config file is JS and belongs to no tsconfig, so the
    // type-aware rules have no program to run against.
    files: ["**/*.js"],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
