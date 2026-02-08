import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";
import js from "@eslint/js";

export default defineConfig([
	{
		files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
		plugins: { js },
		extends: ["js/recommended"],
		languageOptions: {
			globals: globals.node
		}
	},
	tseslint.configs.recommended,
	{
		rules: {
			"semi": ["error", "always"]
		},
		ignores: ["dist/**", "node_modules/**"]
	}
]);
