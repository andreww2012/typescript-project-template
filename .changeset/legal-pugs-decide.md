---
"@andreww2012/typescript-project-template": patch
---

New projects use `eslint-config-un` 1.0.0-rc.5 and pass its checks: `commitlint.config.ts` uses the `RuleConfigSeverity` enum, and the ESLint config drops the options that are now defaults. Markdown code blocks are only formatted with the chosen formatter, and `eslint-plugin-format` is no longer installed
