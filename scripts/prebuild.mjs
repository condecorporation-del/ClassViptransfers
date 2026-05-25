import { spawnSync } from 'node:child_process';

const isDeployContext = process.env.VERCEL === '1' || process.env.CI === 'true';

if (!isDeployContext) {
  console.log('[prebuild] Skipping deploy env validation outside CI/Vercel.');
  process.exit(0);
}

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const result = spawnSync(npmCommand, ['--prefix', 'backend', 'run', 'verify:env:deploy'], {
  stdio: 'inherit',
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
