#!/usr/bin/env node
/**
 * Postbuild helper for Cloudflare Pages deployments.
 *
 * Vite builds the SPA into public/app/ with `emptyOutDir: true`, so any
 * static file that lives inside that directory would be wiped on every
 * build. We regenerate the two Cloudflare-specific files here, after the
 * Vite build has finished, so Cloudflare Pages routes SPA URLs to
 * index.html and serves the JS/CSS bundles with sensible caching headers.
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here    = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(here, '..');
const outDir  = resolve(rootDir, 'public/app');

if (!existsSync(outDir)) {
  console.error(`[postbuild-cloudflare] Build output ${outDir} not found.`);
  console.error('Run `npm run build:cloudflare` from the repo root.');
  process.exit(1);
}

// SPA fallback: any URL that isn't a static file (200 status) falls back
// to index.html so React Router (HashRouter today, BrowserRouter tomorrow)
// can resolve the route on the client.
const redirects = `/*    /index.html   200
`;

// Long-lived caching for hashed/renamed bundles; short cache for HTML so
// deploys land quickly. Adjust as your rollout strategy demands.
const headers = `/sciecola-app.js
  Cache-Control: public, max-age=31536000, immutable
/sciecola-app-chunk*.js
  Cache-Control: public, max-age=31536000, immutable
/sciecola-app.css
  Cache-Control: public, max-age=31536000, immutable
/*.svg
  Cache-Control: public, max-age=86400
/index.html
  Cache-Control: public, max-age=0, must-revalidate
`;

mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, '_redirects'), redirects, 'utf8');
writeFileSync(resolve(outDir, '_headers'),   headers,   'utf8');

console.log('[postbuild-cloudflare] wrote _redirects and _headers to public/app/');
