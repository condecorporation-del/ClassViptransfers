import dotenv from 'dotenv';
import {
  formatEnvIssueReport,
  getEnvConfigIssues,
  getEnvConfigWarnings,
} from '../src/shared/lib/env-safety';

dotenv.config();

const isDeployCheck = process.argv.includes('--deploy');
const isProductionTarget =
  isDeployCheck ||
  process.env.NODE_ENV === 'production' ||
  process.env.VERCEL === '1' ||
  process.env.CI === 'true';

const issues = getEnvConfigIssues(process.env, { enforceProduction: isProductionTarget });
const warnings = getEnvConfigWarnings(process.env);

if (issues.length > 0) {
  console.error('[EnvSafety] Configuration validation failed.\n');
  console.error(formatEnvIssueReport(issues));
  process.exit(1);
}

console.log(
  isDeployCheck
    ? '[EnvSafety] Deploy environment validation passed.'
    : '[EnvSafety] Environment validation passed.',
);

if (warnings.length > 0) {
  console.warn('\n[EnvSafety] Non-blocking warnings:');
  warnings.forEach((warning) => console.warn(`- ${warning}`));
}
