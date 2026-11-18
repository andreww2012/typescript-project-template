import fs from 'node:fs';

// `&&` isn't valid semver: pnpm 11 ignores rules with such ranges, unlike pnpm 12
it('does not use `&&` in version ranges of the template workspace config', () => {
  const workspaceConfig = fs.readFileSync(
    new URL('../template/pnpm-workspace.yaml', import.meta.url),
    'utf8',
  );

  expect(workspaceConfig).not.toContain('&&');
});
