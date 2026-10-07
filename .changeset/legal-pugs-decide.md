---
"@andreww2012/typescript-project-template": patch
---

New projects use `eslint-config-un` 1.0.0-rc.4 and pass its checks: `commitlint.config.ts` uses the `RuleConfigSeverity` enum, and the ESLint config drops the options that are now defaults. With oxfmt, Markdown code blocks are no longer also formatted with Prettier
