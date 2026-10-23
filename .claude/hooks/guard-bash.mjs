#!/usr/bin/env node
// PreToolUse(Bash): refuse commands that bypass human gates, destroy work, or leak secrets.
// Deliberately conservative pattern list: a false positive costs one rephrase, a miss can cost a repo.
import { readInput, projectDir, loadSddConfig, block, allow } from './_lib.mjs';

const input = await readInput();
const cmd = String(input.tool_input?.command ?? '');
if (!cmd.trim()) allow();

const config = loadSddConfig(projectDir(input));
const humanSpecGate = config.gates?.humanApproval?.spec !== false;

// Split into simple commands so each rule sees one program invocation.
const segments = cmd.split(/&&|\|\||;|\n|\|(?!\|)/).map((s) => s.trim().replace(/\\/g, '/')).filter(Boolean);
const words = (seg) => seg.replace(/^(\w+=\S*\s+)+/, '').split(/\s+/);

// Files guarded by guard-files.mjs must not be rewritten through the shell either.
const PROTECTED = String.raw`(\.claude/|CLAUDE\.md|\.mcp\.json|\.sdd/(scripts|templates)/|\.sdd/config\.json|docs/constitution\.md|specs/\d{3}-[^/\s]+/spec\.md)`;
const WRITES_PROTECTED = new RegExp(String.raw`>{1,2}\s*["']?(\./)?${PROTECTED}`);
const MUTATING_TOOL = /^(sed\s+(-\w*\s+)*-\w*i|perl\s+-\w*i|tee|mv|cp|rm|truncate|dd|Set-Content|Add-Content|Out-File|Remove-Item|Move-Item|Copy-Item)\b/i;

const RULES = [
  {
    when: process.env.SDD_ALLOW_HARNESS_EDIT !== '1',
    test: (s) => WRITES_PROTECTED.test(s) || (MUTATING_TOOL.test(s) && new RegExp(PROTECTED).test(s)),
    why: 'that file is part of the harness / constitution / an approval-controlled spec. Use the Edit tool ' +
      '(subject to the same guardrails) or the sdd CLI; harness changes are proposed to the user.',
  },
  {
    when: humanSpecGate,
    test: (s) => /\bsdd\.mjs\b/.test(s) && /\sapprove\b/.test(s),
    why: 'spec approval is a HUMAN gate. Ask the user to review the spec and run ' +
      '`node .sdd/scripts/sdd.mjs approve <id> --by "<name>"` in their own terminal (or label the PR `sdd:approved`).',
  },
  {
    test: (s) => /\bsdd\.mjs\b.*\brun\s+deploy:production\b/.test(s),
    why: 'production deploys run only in CI/CD behind the GitHub "production" environment approval.',
  },
  {
    test: (s) => /^git\s+push\b/.test(s) && /(\s--force\b|\s-f\b|\s--force-with-lease\b|\s\+[\w/.-]+)/.test(s),
    why: 'force-push rewrites shared history. Push a new commit instead.',
  },
  {
    test: (s) => /^git\s+push\b/.test(s) && /\s(?:[\w.-]+\s+)?(?:HEAD:)?(?:refs\/heads\/)?(main|master)(\s|$)/.test(s),
    why: 'never push to the base branch. Push the feature branch and open a pull request.',
  },
  {
    test: (s) => /^git\s+reset\s+.*--hard\b/.test(s) || /^git\s+clean\s+-\w*f/.test(s) || /^git\s+checkout\s+(--\s+)?\.\s*$/.test(s),
    why: 'this discards work irreversibly. Use `git stash` or revert specific files, or ask the user.',
  },
  {
    test: (s) => /^git\s+\w+.*\s--no-verify\b/.test(s),
    why: 'do not bypass git hooks; fix what they report.',
  },
  {
    test: (s) => {
      const w = words(s);
      if (w[0] !== 'rm' || !w.some((x) => /^-\w*[rR]/.test(x) || x === '--recursive')) return false;
      return w.slice(1).some((x) => /^["']?(\/|~|~\/|\/\*|\*|\.|\.\/|\.\.|\.\.\/|\$HOME\/?|[A-Za-z]:[\\/]?)["']?$/.test(x));
    },
    why: 'recursive delete of a root, home or whole working directory.',
  },
  {
    test: (s, all) => /\b(curl|wget|iwr|Invoke-WebRequest)\b/.test(all) && /\|\s*(sudo\s+)?(ba|z|da)?sh\b|\|\s*iex\b/.test(all),
    why: 'piping a download straight into a shell. Download, inspect, then run.',
  },
  {
    test: (s) => /^sudo\b/.test(s),
    why: 'sudo is not available to agents.',
  },
  {
    test: (s) => /^(cat|less|more|head|tail|type|bat|nl|strings|xxd|grep|rg|sed|awk|cp|scp|base64)\b/.test(s) &&
      /(^|[\s/\\'"=])\.env(\.(?!example\b|sample\b|template\b)[\w.-]+)?(?=$|[\s'"])/.test(s),
    why: 'secret env files must not enter the transcript. Read `.env.example` for variable names.',
  },
  {
    test: (s) => /^(printenv|env|set|export\s+-p|Get-ChildItem\s+env:)\s*$/i.test(s),
    why: 'dumping the whole environment can leak secrets. Read the specific non-secret variable you need.',
  },
  {
    test: (s) => /^(npm|pnpm|yarn|cargo|twine|gem|dotnet\s+nuget)\s+(publish|push)\b/.test(s),
    why: 'publishing packages is a release decision for humans/CI.',
  },
  {
    test: (s) => /^(terraform|tofu)\s+(apply|destroy|import)\b/.test(s) || /^kubectl\s+(apply|delete|replace|rollout|scale|patch|edit)\b/.test(s) ||
      /^helm\s+(install|upgrade|uninstall|rollback)\b/.test(s),
    why: 'infrastructure changes go through reviewed CI/CD, not an agent shell.',
  },
  {
    test: (s) => /^chmod\s+(-R\s+)?0?777\b/.test(s),
    why: 'world-writable permissions.',
  },
];

for (const seg of segments) {
  for (const rule of RULES) {
    if (rule.when === false) continue;
    if (rule.test(seg, cmd)) block(rule.why);
  }
}
allow();
