#!/usr/bin/env node
import * as prompts from '@clack/prompts';
import {runTemplateCLI} from 'bingo';
import {promptForOptions} from './prompts.js';
import {template} from './template.js';

const flags = await promptForOptions(process.argv.slice(2));

if (flags) {
  process.argv.push(...flags);
  // @ts-expect-error -- Bingo's types reject required options under `strictFunctionTypes`
  process.exitCode = await runTemplateCLI(template);
} else {
  prompts.cancel('Operation cancelled');
  // Same as Bingo's exit code for cancelled runs
  process.exitCode = 2;
}
