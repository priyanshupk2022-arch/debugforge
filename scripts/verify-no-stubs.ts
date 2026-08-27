import * as fs from 'fs';
import * as path from 'path';
import ts from 'typescript';

const FORBIDDEN_COMMENTS = ['todo', 'fixme', 'implement later', 'placeholder', 'stub', 'not implemented'];

interface StubViolation {
  filePath: string;
  line: number;
  reason: string;
}

function scanFileForStubs(filePath: string): StubViolation[] {
  const violations: StubViolation[] = [];
  const content = fs.readFileSync(filePath, 'utf8');

  // Check 1: Comment Scan for lazy TODO/FIXME markers
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const lower = line.toLowerCase();
    for (const forbidden of FORBIDDEN_COMMENTS) {
      if (lower.includes(`// ${forbidden}`) || lower.includes(`/* ${forbidden}`)) {
        violations.push({
          filePath,
          line: idx + 1,
          reason: `Found forbidden lazy comment: "${forbidden}"`,
        });
      }
    }
  });

  // Check 2: AST Traversal for Empty Function Bodies & Trivial Throws
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true
  );

  function visit(node: ts.Node) {
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isMethodDeclaration(node) ||
      ts.isArrowFunction(node)
    ) {
      if (node.body && ts.isBlock(node.body)) {
        // Check for empty body
        if (node.body.statements.length === 0) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          violations.push({
            filePath,
            line: line + 1,
            reason: `Empty function body detected. Full real implementation required.`,
          });
        }
        // Check for trivial "throw new Error('Not implemented')"
        if (node.body.statements.length === 1) {
          const stmt = node.body.statements[0];
          if (ts.isThrowStatement(stmt)) {
            const text = stmt.getText(sourceFile).toLowerCase();
            if (text.includes('not implemented') || text.includes('todo')) {
              const { line } = sourceFile.getLineAndCharacterOfPosition(stmt.getStart());
              violations.push({
                filePath,
                line: line + 1,
                reason: `Unimplemented throw placeholder detected: "${stmt.getText(sourceFile)}"`,
              });
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

function scanDirectory(dir: string): StubViolation[] {
  let allViolations: StubViolation[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
        allViolations = allViolations.concat(scanDirectory(fullPath));
      }
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      allViolations = allViolations.concat(scanFileForStubs(fullPath));
    }
  }

  return allViolations;
}

// Execute Anti-Cheat Audit across packages/
console.log('🔍 Running ZeroShield Anti-Cheat AST Stub Verifier...');
const packagesDir = path.resolve(process.cwd(), 'packages');
const srcDir = path.resolve(process.cwd(), 'src');
const fixturesDir = path.resolve(process.cwd(), 'fixtures');

let violations: StubViolation[] = [];
if (fs.existsSync(packagesDir)) violations = violations.concat(scanDirectory(packagesDir));
if (fs.existsSync(srcDir)) violations = violations.concat(scanDirectory(srcDir));
if (fs.existsSync(fixturesDir)) violations = violations.concat(scanDirectory(fixturesDir));

if (violations.length > 0) {
  console.error('\n🚨 ANTI-CHEAT VIOLATIONS DETECTED:');
  violations.forEach(v => {
    console.error(`  ❌ ${v.filePath}:${v.line} - ${v.reason}`);
  });
  console.error('\n🛑 Low-reasoning model cheating blocked! Full real production implementations are required.');
  process.exit(1);
} else {
  console.log('✅ ZERO STUBS / ZERO PLACEHOLDERS DETECTED! Code is 100% fully implemented.\n');
  process.exit(0);
}
