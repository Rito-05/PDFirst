// scripts/watch-sync.mjs - Automated Git sync watcher for PDFirst
import { watch } from 'fs';
import { exec } from 'child_process';
import { resolve } from 'path';

let debounceTimer = null;
const DEBOUNCE_DELAY_MS = 3000;
let isSyncing = false;

function triggerSync() {
  if (isSyncing) return;
  isSyncing = true;
  console.log('[Auto-Sync] Detected file changes. Syncing to GitHub origin/main...');

  exec('git add -A && git commit -m "chore: auto-sync changes to GitHub" && git push origin main', (error, stdout, stderr) => {
    isSyncing = false;
    if (error) {
      if ((stdout && stdout.includes('nothing to commit')) || (stderr && stderr.includes('nothing to commit'))) {
        console.log('[Auto-Sync] Working tree clean, nothing to commit.');
      } else {
        console.warn('[Auto-Sync] Sync notification:', stderr || error.message);
      }
    } else {
      console.log('[Auto-Sync] Successfully pushed updates to GitHub!\n', stdout);
    }
  });
}

function onChange(eventType, filename) {
  if (!filename) return;
  // Ignore git metadata, node_modules, and build outputs
  if (
    filename.startsWith('.git') ||
    filename.includes('node_modules') ||
    filename.startsWith('dist') ||
    filename.endsWith('.log')
  ) {
    return;
  }

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(triggerSync, DEBOUNCE_DELAY_MS);
}

try {
  watch(process.cwd(), { recursive: true }, onChange);
  console.log('[Auto-Sync] Watching entire project directory for file changes...');
} catch (err) {
  console.error('[Auto-Sync] Error starting file watcher:', err);
}

console.log('[Auto-Sync] Auto-sync daemon is active. Any code or file changes will automatically be committed and pushed to GitHub.');
