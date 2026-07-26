/**
 * Renders the built public API of bofa-design-system as a stable markdown report, and fails when it
 * changes without the report being updated.
 *
 * Building both apps in this workspace does not prove the library is safe for consumers: they
 * compile against the published `.d.ts`, and it is the template-facing surface — selector, inputs,
 * outputs, content slots — that an `ng update` or an MDC schematic quietly rewrites. Angular's
 * compiler encodes all of that in the emitted `ɵcmp` declaration, so the built types are the
 * honest source for what downstream teams actually depend on.
 *
 *   node tools/api-surface.mjs --write   regenerate api-report/bofa-design-system.api.md
 *   node tools/api-surface.mjs --check   exit non-zero if the built surface differs from it
 *
 * Requires `ng build bofa-design-system` to have run.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import ts from 'typescript';

const ENTRY = resolve('dist/bofa-design-system/index.d.ts');
const REPORT = resolve('api-report/bofa-design-system.api.md');

/** Angular encodes component metadata as type arguments in this fixed order. */
const CMP_ARGS = ['type', 'selector', 'exportAs', 'inputs', 'outputs', 'queries', 'ngContentSelectors', 'isStandalone'];
const DIR_ARGS = CMP_ARGS;
const MOD_ARGS = ['type', 'declarations', 'imports', 'exports'];

function typeArgs(node) {
  return node?.type && ts.isTypeReferenceNode(node.type) ? (node.type.typeArguments ?? []) : [];
}

function angularDecl(member) {
  if (!ts.isPropertyDeclaration(member) || !member.type || !ts.isTypeReferenceNode(member.type)) return null;
  const kind = member.type.typeName.getText().replace(/^.*\./, '');
  const shapes = {
    'ɵɵComponentDeclaration': CMP_ARGS,
    'ɵɵDirectiveDeclaration': DIR_ARGS,
    'ɵɵNgModuleDeclaration': MOD_ARGS,
  };
  if (!shapes[kind]) return null;
  const args = typeArgs(member);
  const out = { kind };
  shapes[kind].forEach((name, i) => { out[name] = args[i]?.getText() ?? ''; });
  return out;
}

/** `{ "variant": "variant"; "disabled": "disabled"; }` -> ['disabled', 'variant'] — sorted, so a
 *  reordered declaration doesn't read as an API change. */
function bindings(literal) {
  if (!literal || literal === 'never' || literal === '{}') return [];
  return [...literal.matchAll(/"([^"]+)"\s*:\s*"([^"]+)"/g)]
    .map(([, prop, name]) => (prop === name ? name : `${name} (as ${prop})`))
    .sort();
}

function tupleItems(literal) {
  if (!literal || literal === 'never') return [];
  return [...literal.matchAll(/"([^"]*)"/g)].map(([, v]) => v);
}

function typeList(literal) {
  if (!literal || literal === 'never') return [];
  return [...literal.matchAll(/typeof\s+[A-Za-z0-9_$]+\.([A-Za-z0-9_$]+)/g)].map(([, v]) => v).sort();
}

/** Collapse whitespace so reformatting alone never shows up as an API change. */
function oneLine(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function renderClass(decl) {
  const lines = [];
  const meta = decl.members.map(angularDecl).find(Boolean);

  if (meta?.kind === 'ɵɵNgModuleDeclaration') {
    lines.push(`### \`${decl.name.text}\` — NgModule`, '');
    for (const [label, key] of [['Declares', 'declarations'], ['Imports', 'imports'], ['Exports', 'exports']]) {
      const items = typeList(meta[key]);
      lines.push(`- **${label}:** ${items.length ? items.map((i) => `\`${i}\``).join(', ') : '_none_'}`);
    }
    lines.push('');
    return lines;
  }

  if (meta) {
    const selector = meta.selector.replace(/^"|"$/g, '');
    lines.push(`### \`<${selector}>\` — \`${decl.name.text}\``, '');

    const inputs = bindings(meta.inputs);
    const outputs = bindings(meta.outputs);
    const slots = tupleItems(meta.ngContentSelectors);

    lines.push(`- **Inputs:** ${inputs.length ? inputs.map((i) => `\`${i}\``).join(', ') : '_none_'}`);
    lines.push(`- **Outputs:** ${outputs.length ? outputs.map((o) => `\`${o}\``).join(', ') : '_none_'}`);
    // Slot count is load-bearing: multiple bare <ng-content> slots silently drop projected content.
    lines.push(`- **Content slots:** ${slots.length ? slots.map((s) => `\`${s || '*'}\``).join(', ') : '_none_'}`);
    if (meta.exportAs && meta.exportAs !== 'never') lines.push(`- **exportAs:** \`${meta.exportAs}\``);
    lines.push(`- **Standalone:** ${meta.isStandalone === 'true' ? 'yes' : 'no'}`);
    lines.push('');
  } else {
    lines.push(`### \`${decl.name.text}\``, '');
  }

  const members = decl.members
    .filter((m) => m.name && !m.name.getText().startsWith('ɵ'))
    .filter((m) => !m.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.PrivateKeyword))
    .map((m) => oneLine(m.getText()))
    .sort();

  if (members.length) {
    lines.push('```ts', ...members, '```', '');
  }
  return lines;
}

function renderOther(decl, name) {
  return [`### \`${name}\``, '', '```ts', oneLine(decl.getText()), '```', ''];
}

function build() {
  if (!existsSync(ENTRY)) {
    console.error(`No built types at ${ENTRY}. Run: npx ng build bofa-design-system`);
    process.exit(2);
  }

  const program = ts.createProgram([ENTRY], { target: ts.ScriptTarget.ES2020, declaration: true });
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(ENTRY);
  const moduleSymbol = checker.getSymbolAtLocation(source);
  const exports = checker.getExportsOfModule(moduleSymbol);

  const classes = [];
  const modules = [];
  const others = [];

  for (const symbol of exports) {
    const resolved = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
    const decl = resolved.declarations?.[0];
    if (!decl) continue;

    if (ts.isClassDeclaration(decl)) {
      const isModule = decl.members.some((m) => angularDecl(m)?.kind === 'ɵɵNgModuleDeclaration');
      (isModule ? modules : classes).push([symbol.getName(), decl]);
    } else {
      others.push([symbol.getName(), decl]);
    }
  }

  const byName = (a, b) => a[0].localeCompare(b[0]);
  const lines = [
    '# Public API — `bofa-design-system`',
    '',
    'Generated by `tools/api-surface.mjs` from the built `.d.ts`. Do not edit by hand.',
    '',
    'This is the surface downstream consumers compile and template against. **Any diff here is a',
    'breaking-change conversation**, not an implementation detail — the migration is supposed to',
    'absorb Material\'s churn so that this file does not move.',
    '',
    '## Components',
    '',
  ];

  for (const [, decl] of classes.sort(byName)) lines.push(...renderClass(decl));
  lines.push('## Modules', '');
  for (const [, decl] of modules.sort(byName)) lines.push(...renderClass(decl));
  lines.push('## Types and constants', '');
  for (const [name, decl] of others.sort(byName)) lines.push(...renderOther(decl, name));

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

const report = build();
const mode = process.argv.includes('--check') ? 'check' : 'write';

if (mode === 'write') {
  mkdirSync(dirname(REPORT), { recursive: true });
  writeFileSync(REPORT, report);
  console.log(`Wrote ${REPORT}`);
  process.exit(0);
}

if (!existsSync(REPORT)) {
  console.error(`No committed report at ${REPORT}. Run: node tools/api-surface.mjs --write`);
  process.exit(1);
}

const committed = readFileSync(REPORT, 'utf8');
if (committed === report) {
  console.log('PASS — the public API is unchanged.');
  process.exit(0);
}

const a = committed.split('\n');
const b = report.split('\n');
console.error('FAIL — the public API changed.\n');
for (let i = 0; i < Math.max(a.length, b.length); i++) {
  if (a[i] !== b[i]) {
    if (a[i] !== undefined) console.error(`  - ${a[i]}`);
    if (b[i] !== undefined) console.error(`  + ${b[i]}`);
  }
}
console.error(
  '\nIf this is intended, run `node tools/api-surface.mjs --write`, commit the report, and say on' +
  '\nthe PR which consumers have to change. If it is not intended, the migration leaked.'
);
process.exit(1);
