// scripts/watch-sync.mjs - Automated Git sync watcher for PDFirst
import { watch } from 'fs';
import { exec } from 'child_process';
import { resolve } from 'path';

let debounceTimer = null;
const DEBOUNCE_DELAY_MS = 5000;
let isSyncing = false;

function triggerSync() {
  if (isSyncing) return;
  isSyncing = true;
  console.log('[Auto-Sync] Detected file changes. Syncing to GitHub origin/main...');

  exec('git add -A && git commit -m "chore: auto-sync changes to GitHub" && git push origin main', (error, stdout, stderr) => {
    isSyncing = false;
    if (error) {
      if (stdout.includes('nothing to commit') || stderr.includes('nothing to commit')) {
        console.log('[Auto-Sync] Working tree clean, nothing to commit.');
      } else {
        console.warn('[Auto-Sync] Sync notification:', stderr || error.message);
      }
    } else {
      console.log('[Auto-Sync] Successfully pushed updates to GitHub!\n', stdout);
    }
  });
}

function onChange() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(triggerSync, DEBOUNCE_DELAY_MS);
}

const watchDirs = ['src', 'public', 'tests'];
for (const dir of watchDirs) {
  try {
    watch(resolve(process.cwd(), dir), { recursive: true }, onChange);
    console.log(`[Auto-Sync] Watching directory: ${dir}/`);
  } catch (e) {
    // Ignore missing directories
  }
}

console.log('[Auto-Sync] Auto-sync watcher is running. Any file edits will automatically be pushed to GitHub.');
