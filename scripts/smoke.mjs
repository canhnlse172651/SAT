#!/usr/bin/env node
// Post-deploy smoke test (toolchain "smoke"): node scripts/smoke.mjs <baseUrl>
// Retries until SMOKE_TIMEOUT_MS while the new deployment warms up; exits non-zero on failure.
const base = (process.argv[2] ?? process.env.DEPLOY_URL ?? '').replace(/\/+$/, '');
if (!base) {
  console.error('usage: node scripts/smoke.mjs <baseUrl>');
  process.exit(2);
}

const checks = [
  ['GET /api/health', '/api/health', (res, body) => res.ok && JSON.parse(body).status === 'ok'],
  ['GET /api/ready', '/api/ready', (res) => res.status === 200],
  [
    'GET / serves the SPA',
    '/',
    (res) => res.ok && (res.headers.get('content-type') ?? '').includes('text/html'),
  ],
];

const deadline = Date.now() + Number(process.env.SMOKE_TIMEOUT_MS ?? 120_000);
for (const [name, path, passes] of checks) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(base + path, { signal: AbortSignal.timeout(5_000) });
      const body = await res.text();
      if (passes(res, body)) {
        console.log(`✔ ${name} (${res.status})`);
        break;
      }
      throw new Error(`unexpected response ${res.status}: ${body.slice(0, 200)}`);
    } catch (err) {
      if (Date.now() > deadline) {
        console.error(`✗ ${name}: ${err.message}`);
        process.exit(1);
      }
      await new Promise((r) => setTimeout(r, Math.min(1_000 * attempt, 5_000)));
    }
  }
}
console.log(`✔ smoke passed for ${base}`);
