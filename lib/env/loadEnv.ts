import { loadEnvConfig } from '@next/env';

export function loadEnv() {
    const projectDir = process.cwd();
    loadEnvConfig(projectDir);
}
