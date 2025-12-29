/**
 * Bootstrap script to load environment variables before any other imports.
 * Must be imported first in any script that uses DB or env vars.
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the project root (parent of scripts directory)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// Load env files in priority order
config({ path: resolve(projectRoot, '.env.local'), override: false });
config({ path: resolve(projectRoot, '.env'), override: false });

console.log('[bootstrap] Environment loaded');
