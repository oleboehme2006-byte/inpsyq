/**
 * Canonical Environment Loader
 * 
 * Load order (highest priority first):
 * 1. .env.local
 * 2. .env.development.local  
 * 3. .env
 * 4. process.env (fallback)
 * 
 * MUST be called before any imports that use env vars.
 * Idempotent and safe if files are missing.
 */

import * as fs from 'fs';
import * as path from 'path';

let _loaded = false;

export function loadEnv(): void {
    if (_loaded) return;
    _loaded = true;

    const projectDir = process.cwd();

    // Files in priority order (later files override earlier)
    const envFiles = [
        '.env',
        '.env.development.local',
        '.env.local',
    ];

    for (const file of envFiles) {
        const filePath = path.join(projectDir, file);
        if (fs.existsSync(filePath)) {
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                const lines = content.split('\n');

                for (const line of lines) {
                    const trimmed = line.trim();
                    // Skip comments and empty lines
                    if (!trimmed || trimmed.startsWith('#')) continue;

                    const eqIndex = trimmed.indexOf('=');
                    if (eqIndex === -1) continue;

                    const key = trimmed.slice(0, eqIndex).trim();
                    let value = trimmed.slice(eqIndex + 1).trim();

                    // Remove quotes if present
                    if ((value.startsWith('"') && value.endsWith('"')) ||
                        (value.startsWith("'") && value.endsWith("'"))) {
                        value = value.slice(1, -1);
                    }

                    // Only set if not already defined (process.env takes precedence)
                    if (process.env[key] === undefined) {
                        process.env[key] = value;
                    }
                }
            } catch (e) {
                // Silently continue if file can't be read
            }
        }
    }
}

/**
 * Guard function for scripts
 * Call at script entry to ensure loadEnv was properly invoked.
 */
export function assertEnvLoaded(source: string): void {
    if (!_loaded) {
        console.error(`[ENV] FATAL: loadEnv() was not called before imports in ${source}`);
        console.error('[ENV] Add this at the top of your script:');
        console.error("  import { loadEnv } from '../lib/env/loadEnv';");
        console.error('  loadEnv();');
        process.exit(1);
    }
}

export function isEnvLoaded(): boolean {
    return _loaded;
}
