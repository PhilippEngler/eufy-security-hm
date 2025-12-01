const {
    defineConfig,
    globalIgnores,
} = require("eslint/config");

const tsParser = require("@typescript-eslint/parser");
const js = require("@eslint/js");

const {
    FlatCompat,
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

module.exports = defineConfig([{
    languageOptions: {
        parser: tsParser,
        ecmaVersion: 2022,
        sourceType: "module",

        parserOptions: {
            project: "./tsconfig.json",
        },
    },

    extends: compat.extends("plugin:@typescript-eslint/recommended"),
    plugins: {},

    rules: {
        "indent": "off",

        //"@typescript-eslint/indent": ["error", 4, {
        "@/indent": ["error", 4, {
            "SwitchCase": 1,
        }],

        "quotes": ["error", "double", {
            "avoidEscape": true,
            "allowTemplateLiterals": true,
        }],

        "@typescript-eslint/no-parameter-properties": "off",
        "@typescript-eslint/no-explicit-any": "off",

        "@typescript-eslint/no-use-before-define": ["error", {
            functions: false,
            typedefs: false,
            classes: false,
        }],

        "@typescript-eslint/no-unused-vars": ["error", {
            ignoreRestSiblings: true,
            argsIgnorePattern: "^_",
        }],

        "@typescript-eslint/explicit-function-return-type": ["warn", {
            allowExpressions: true,
            allowTypedFunctionExpressions: true,
        }],

        "@typescript-eslint/no-object-literal-type-assertion": "off",
        "@typescript-eslint/interface-name-prefix": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "no-var": "error",
        "prefer-const": "error",
        "no-trailing-spaces": "error",
    },
}, globalIgnores(["**/*.js", "**/eufysecurity.ts"]), {
    files: ["**/*.test.ts"],

    rules: {
        "@typescript-eslint/explicit-function-return-type": "off",
    },
}]);