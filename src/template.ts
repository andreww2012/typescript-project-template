import fs from 'node:fs/promises';
import path from 'node:path';
import {type Creation, createTemplate} from 'bingo';
import {z} from 'zod';

const SNAPSHOT_PATH = path.join(import.meta.dirname, '../dist/files.json');

const UTILITY_LIBRARY = '@andreww2012/unutils';

const SNAPSHOT_SCHEMA = z.object({
  files: z
    .object({'package.json': z.string(), 'README.md': z.string()})
    .catchall(z.custom<Creation['files'][string]>()),
  symlinks: z.record(z.string(), z.string()),
});

// Not `looseObject` with known fields, because it would move them first and break the key order
const PACKAGE_JSON_SCHEMA = z.record(z.string(), z.unknown());

const DEPENDENCIES_SCHEMA = z.record(z.string(), z.string()).optional();

export const template = createTemplate({
  about: {
    name: 'TypeScript Project Template',
    description: "@andreww2012's personal generic TypeScript project template",
    repository: {
      owner: 'andreww2012',
      repository: 'typescript-project-template',
    },
  },
  options: {
    author: z.string().optional().describe('`package.json` author (defaults to `--owner`)'),
    description: z
      .string()
      .optional()
      .describe('Short description for `package.json` and `README.md`'),
    owner: z.string().describe('GitHub user or organization the repository is under'),
    repository: z.string().describe('Repository name, also used as the package name'),
    // Bingo only prompts for options that are required or have a default.
    // It reads the description from the inner schema, so `describe` must come before `default`.
    // Its CLI flags parser doesn't support `z.enum`, but supports unions of literals
    utils: z
      .union([z.literal(UTILITY_LIBRARY), z.literal('none')])
      .describe('utility library')
      .default(UTILITY_LIBRARY),
  },
  produce: async ({options}) => {
    const {
      files: {'package.json': packageJsonText, 'README.md': readme, ...files},
      symlinks,
    } = SNAPSHOT_SCHEMA.parse(JSON.parse(await fs.readFile(SNAPSHOT_PATH, 'utf8')));
    const packageJson = PACKAGE_JSON_SCHEMA.parse(JSON.parse(packageJsonText));

    // Bingo defaults the repository to the raw `--directory` value, which can be a path
    const name = path.basename(options.repository);
    const dependencies = Object.entries(
      DEPENDENCIES_SCHEMA.parse(packageJson.dependencies) || {},
    ).filter(
      ([packageName]) => packageName !== UTILITY_LIBRARY || options.utils === UTILITY_LIBRARY,
    );

    return {
      files: {
        ...files,
        'package.json': JSON.stringify(
          {
            ...packageJson,
            name,
            description: options.description,
            author: options.author || options.owner,
            dependencies: dependencies.length > 0 ? Object.fromEntries(dependencies) : undefined,
          },
          null,
          2,
        ),
        'README.md': [`# ${name}`, options.description, readme].filter(Boolean).join('\n\n'),
      },
      // Bingo runs scripts without a shell, so each command must be a separate item
      scripts: Object.entries(symlinks).map(([linkPath, target]) => ({
        commands: [`mkdir -p ${path.dirname(linkPath)}`, `ln -sfn ${target} ${linkPath}`],
      })),
      suggestions: [
        'Install dependencies with `pnpm install`',
        'Go through the setup checklist in `README.md`',
      ],
    };
  },
});
