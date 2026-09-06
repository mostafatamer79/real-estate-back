# 🛡️ Husky and Commitlint Setup Guide

This guide will walk you through setting up **Husky** and **Commitlint** to enforce pre-commit checks and consistent commit message formatting in your project. Additionally, we'll include instructions for configuring ESLint with an `ignores` property directly in the ESLint configuration file, avoiding the need for a separate `.eslintignore` file.

---

## 📦 Setup Instructions

### 1. Install Husky

```bash
npm install --save-dev husky lint-staged
```

### 2. Initialize Husky

```bash
npx husky init
```

This will:

- Create a `.husky/` directory
- Add a sample `pre-commit` hook
- Update your `package.json` scripts

### 3. Replace `.husky/pre-commit` Hook Content

Open `.husky/pre-commit` and replace its contents with the following:

```sh
#!/usr/bin/env sh

echo "🔍 Running lint-staged checks..."
npm run lint-staged || (echo "❌ lint-staged failed. Please fix the issues and try again." && exit 1)

echo "📝 Checking code format..."
npm run check-format || (echo "❌ Code formatting issues found. Please run 'npm run format' and commit again." && exit 1)

echo "🔎 Running lint checks..."
npm run check-lint || (echo "❌ ESLint issues found. Please run 'npm run lint' and to fix run 'npx eslint . --fix' and commit again." && exit 1)

echo "✅ All checks passed! 🚀✨ Preparing to commit... 🔐"
```

> ✅ Ensure you have the following scripts defined in your `package.json`:
>
> ```json
> "scripts": {
>   "lint-staged": "lint-staged",
>   "check-format": "prettier --check .",
>   "check-lint": "eslint ."
> }
> ```

---

## ✅ Set Up Commitlint

### 1. Install Commitlint and Config

```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional
```

### 2. Create `commitlint.config.js`

In the root of your project, create a file named `commitlint.config.js` with the following content:

```js
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "init",
        "feat",
        "fix",
        "refactor",
        "docs",
        "style",
        "test",
        "chore",
        "prettier",
        "lint",
      ],
    ],
    "type-case": [2, "always", "lower-case"],
    "subject-case": [2, "always", "lower-case"],
    "subject-empty": [2, "never"],
    "type-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."],
    "header-max-length": [2, "always", 72],
  },
};
```

### 3. Add Commit Message Hook

Run the following command to add a `commit-msg` hook with Husky:

```bash
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'
```

This will create `.husky/commit-msg` and populate it with:

```sh
npx --no -- commitlint --edit "$1"
```

---

## 🧪 Test Your Setup

### Step 1: Add some changes

```bash
git add .
```

### Step 2: Try committing with an invalid message

```bash
git commit -m "add new feature"
```

**Expected output:**

```
⧗   input: add new feature
✖   subject may not be empty [subject-empty]
✖   type may not be empty [type-empty]
✖   found 2 problems, 0 warnings
ⓘ   Get help: https://github.com/conventional-changelog/commitlint/#what-is-commitlint
husky - commit-msg script failed (code 1)
```

### Step 3: Try committing with a valid message

```bash
git commit -m "feat: add new feature"
```

✅ The commit will go through if all checks pass.

---

## 🧾 Example Commit Messages

- `feat: add user authentication`
- `fix: resolve login issue`
- `refactor: simplify navbar logic`
- `style: apply consistent formatting`
- `docs: update contribution guide`
- `test: add tests for form validation`
- `chore: update project dependencies`
- `prettier: format all files`
- `lint: fix eslint warnings`

---

## 🐞 Troubleshooting

### ❌ `subject may not be empty`

✅ Use this format:

```bash
git commit -m "feat: implement login"
```

### ❌ `type may not be empty`

✅ Use a valid type such as `feat`, `fix`, `docs`, etc.

### ❌ `type must be in lower-case`

✅ Example:

```bash
git commit -m "fix: correct typo"
```

### ❌ `subject must be in lower-case`

✅ Example:

```bash
git commit -m "docs: update readme"
```

### ❌ `header may not exceed 72 characters`

✅ Keep your message concise and under 72 characters.

---

## 🛠️ ESLint Configuration with `ignores` Property

Instead of creating a separate `.eslintignore` file, you can define ignored paths directly in your ESLint configuration file. Here's an example configuration:

Create or update your ESLint configuration file (`eslint.config.js`) with the following content:

```js
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/out/**",
      "**/build/**",
    ],
  },
  ...compat.config({
    extends: ["next/core-web-vitals", "next/typescript", "prettier"],
    rules: {},
  }),
];

export default eslintConfig;
```

This configuration:

- Specifies paths to ignore during linting (e.g., `node_modules`, `.next`, `dist`, etc.).
- Extends recommended ESLint configurations for Next.js, TypeScript, and Prettier.

---

Happy Committing! 🎉
