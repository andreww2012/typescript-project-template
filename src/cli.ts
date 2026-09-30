#!/usr/bin/env node
import {runTemplateCLI} from 'bingo';
import {template} from './template.js';

// @ts-expect-error -- bingo's types reject templates with required options under `strictFunctionTypes`
process.exitCode = await runTemplateCLI(template);
