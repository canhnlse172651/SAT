// Toolchain contract: agents, hooks and CI never call `npm test` / `pytest` / `go test` directly.
// They call `sdd run <task>`, which resolves the command from .sdd/config.json → toolchain.
// Swapping the stack therefore means editing one JSON object, not every prompt and workflow.
import { spawnSync } from 'node:child_process';

export const CI_STEPS = ['lint', 'typecheck', 'test', 'build'];

export function runTool(ctx, name, extraArgs = [], { required = false, quiet = false } = {}) {
  const cmd = ctx.config.toolchain?.[name];
  if (!cmd) {
    const msg = `toolchain.${name} is not configured in .sdd/config.json`;
    if (required) {
      console.error(`✗ ${msg}`);
      return 1;
    }
    if (!quiet) console.log(`⏭  skip ${name}: ${msg}`);
    return 0;
  }
  const full = [cmd, ...extraArgs.map(quoteArg)].join(' ');
  if (!quiet) console.log(`▶ ${name}: ${full}`);
  const r = spawnSync(full, { cwd: ctx.root, stdio: quiet ? 'ignore' : 'inherit', shell: true });
  if (r.error) {
    console.error(`✗ ${name}: ${r.error.message}`);
    return 1;
  }
  return r.status ?? 1;
}

function quoteArg(a) {
  return /^[\w@%+=:,./\\-]+$/.test(a) ? a : `"${a.replace(/"/g, '\\"')}"`;
}
