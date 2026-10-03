# Style Guide

Source: <https://github.com/andreww2012/agents/blob/098151f47b72e975f4098dc4d7d3ec6887767abd/.agents/style-guide.md>

## Communication

**CRITICAL:** Use plain/simple English for your output, while still respecting language and prose style used in the current project for generated code.
Most likely you'll be read by people who are not native or C2-level speakers, so adapt accordingly.
Avoid:

  - long dashes;
  - terms and phrases like "load-bearing", "byte-identical", "it's not x; it's y", "earn its place" and similar;
  - complex metaphors and jargon;
  - mannered prose;
  - advanced, fancy or rarely used words.

In general, don't be verbose.
If something can be said shorter and simpler without losing meaning, do it: people shouldn't waste energy just to understand you.
Sound human.
None of the above is a hard ban: use anything if it actually fits.
This applies to all languages, not only English.

Don't report how extensively you've verified your work - if you need to say that, say *very* briefly.

Don't say (unless asked explicitly) you have been following this style guide; just follow it.
In general, don't mention that you followed an instruction - that is implied.

## Code

- Use `const` instead of `let` whenever possible.
- Use arrow functions whenever possible.
- Avoid common shorthands like `str`, `arr`, `cls`, `brk`, `err`, `val`, `pkg`, `dir`, etc.
  Use full words.
  The only exceptions are: `dict`, `ctx`, `acc`, `fn`, `docs` (when it's shorthand for "documentation", not "document"), `dev`, `param`, index variables like `i`/`j`/etc, `coeff`, `env`.
- Never omit curly braces around blocks (like `if`, `else`, etc.)
- Let the type system infer types whenever possible: prefer implicit/inferred return types.
  Especially avoid:
  - Specifying explicit return types for functions if it's the same as the inferred type;
  - Having both an explicit return type and an unsafe cast of the return value in the same function.
  - An explicit return type is fine when it saves casting other returned values.
- Don't `export` symbols that are neither used in other files nor part of the public API.
- Hoist symbols and literals (like regexes, functions, constants, arrays, `Set`, etc.) as high as possible.
- Prefer non-strict equality for `null` and `undefined` comparisons (`== null`, `!= null`) unless it would actually change the existing logic.
- Prefer "direct" conditions over negated ones:
  - ✅ `a ? b : c`, `if (a) { ... } else { ... }`
  - ❌ `!a ? c : b`, `if (!a) { ... } else { ... }`
- If you need a map that is initially empty and will be mutated, use `Map` instead of a plain object whenever possible: adding or removing object properties is often slower than with `Map`.
- If `||` and `??` operators work the same, prefer using `||`.
- For constants, use CONSTANT_CASE <=> value is statically constructed:
  - ✅ `const FOO = 'bar'`, `const FOO = ['bar', 1 + 2]`;
  - ❌ `const FOO = ['bar', Math.random()]`.
- Prefer `Array#reduce` over creating an object and modifying its properties in a loop.
- When a symbol is only used once, prefer to inline it unless it is non-trivial or its name conveys meaning the value alone doesn't (e.g. don't inline `const DEFAULT_SORTING = 'rank'` even if `DEFAULT_SORTING` is only used once).

### TypeScript

- Do your best to avoid `any` and type casting (`as ...`) in favor of `unknown` or other clever workarounds.
  Safe type casting exceptions: `as unknown`, `as const`, `satisfies T as T`.
- Prefer `Record<string, unknown>` over the `object` type as the former is usually simpler to reason about.
- Don't use `satisfies T` if the regular type annotation (`: T`) would work the same.

### Style

- Sort symbols in `export {...}` expressions alphabetically, unless it makes sense to do something else (likely group exports, but they must be sorted within each group too).
  Always sort symbols in `import {...}` expressions and sort import statements themselves in [`sort-imports`](https://eslint.org/docs/latest/rules/sort-imports) and [`import/order`](https://raw.githubusercontent.com/un-ts/eslint-plugin-import-x/refs/tags/v4.17.1/docs/rules/order.md) orders respectively.
  Unless the used linter's config says otherwise, assume these `import/order` options: `{groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'], alphabetize: {order: 'asc'}}`.
- In general, in *large* lists prefer keeping things alphabetical, if it makes sense and you're not told otherwise.
- Keep each sentence in Markdown or JSDoc on a separate line, exactly like in this document.
  Exception: `.changeset/*.md` files, as [changesets](https://github.com/changesets/changesets) would render them differently in the changelog.

### Comments

- Only write comments that add real value, such as explaining *truly* non-obvious choices or behavior, which is very hard to understand from code alone.
  Don't repeat what the code already says.
- Keep comments short and clear, but don't lose their value.
- Never put a full stop at the very end of a comment.
- Wrap comments to fit the max line length (usually set in `.editorconfig` or the formatter config).
- Minimize referencing symbol (variable) names in comments: if they ever get renamed in the codebase, there's a real risk of your reference becoming stale.

## Workflow

### Committing

NEVER stage/unstage or commit changes unless explicitly asked to.
Assume your change may be staged or committed by a user (most likely) or another agent at any point.
Unless you're asked to, never add yourself as a co-author.
At the end of your work, *suggest* commit message(s), respecting the project committing style (often it's enforced by `commitlint`).

### Other

Use git stash only if there's no other way: prefer git worktrees or throwaway repos.

## Misc (still VERY important)

Before implementing something, check the repo's `.{agents,claude}/skills` directory for relevant instructions.

Always challenge your implementation for performance, ergonomics and code length issues and find ways to improve it.
Adhere to DRY, KISS, YAGNI, Rule of three and other principles/rules of writing clean and maintainable code.
Don't over-engineer or over-optimize things though - this is not required in most cases.

Use `kebab-case` for file and directory names, unless they should be called differently by convention (like `README.md`, `AGENTS.md`, etc.).

Avoid British variants of words like *behaviour* or *organisation* unless the project allows them.

Avoid invoking unused package managers' commands - e.g. if `pnpm` is used in the project, you must use `pnpm why` instead of `npm why`, unless the equivalent is missing.
If [`@antfu/ni` commands](https://raw.githubusercontent.com/antfu-collective/ni/refs/heads/main/README.md) are available, prefer them over package manager native ones (e.g. `ni` instead of `(p)npm i(nstall)`, `nr` instead of `(p)npm run` and so on).

Avoid editing generated files, including package managers' lockfiles, unless there's a good reason to do otherwise.

## Testing tools, linters and checkers

When the task is done, run the available tools on *all changed* files (not only source files!), unless it's not possible or you're told otherwise.
Ignore the pre-existing unrelated issues.
If there's a package.json script for the tool, prefer it over calling the tool directly.

The commonly used tools are as follows (may and will vary depending on a project): `tsc`, `vue-tsc`, `eslint`, `oxlint`, `prettier`, `oxfmt`, `vitest`, `knip`, `cspell` (use `--no-progress --no-summary`), dependency vulnerability checker (if the lockfile was modified), for example `pnpm audit --audit-level high` (usually only high+ vulnerabilities are important to fix).

If you encounter a linter error that can be fixed in multiple ways, always weigh all options INCLUDING disabling the rule for this line (or, much more rarely, for the entire file) before fixing.

### CSpell

If a word to ignore is only found in a single file:

- Use top-level comment `cspell:ignore words to disable` if the word occurs more than once in a file, or it's not possible to use the inline comment `cspell:disable-line`
- Otherwise, use that inline comment.
  Note: it disables the whole line, so keep that line short.

## Concrete software instructions

- To write a CLI, prefer `cleye`, unless a new dependency is unwanted or another tool was suggested.
  Always set `strictFlags: true` when using it.
- If you're asked to create a changeset (<https://changesets.dev/>), always use its underlying name generator, `human-id`, for file names.

### Vue

- Move static variables into a separate non-setup `<script>` block in Vue SFCs for performance.
- Do use inline composables: <https://alexop.dev/posts/inline-vue-composables-refactoring>
- Prefer `shallowRef` over `ref`, but only when that actually makes a difference (for example, `shallowRef(false)` does not).
- Don't add `| null` as a possible type for refs for no reason - usually implicit `undefined` works just fine.