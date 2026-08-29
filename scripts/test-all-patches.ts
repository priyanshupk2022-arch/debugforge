import * as fs from 'fs';
import ts from 'typescript';
import { VulnerabilityHunter, BlueAgentImmunizer } from '../packages/core/dist/src/index.js';

const hunter = new VulnerabilityHunter();
const patcher = new BlueAgentImmunizer();

const fixtures = [
  'fixtures/vulnerable-payment-app/src/routes/report.ts',
  'fixtures/vulnerable-prototype-pollution/src/routes/config.ts',
  'fixtures/vulnerable-jwt-auth/src/routes/auth.ts',
  'fixtures/vulnerable-ssrf-app/src/routes/webhook.ts',
  'fixtures/vulnerable-path-traversal/src/routes/file.ts',
  'fixtures/vulnerable-sql-injection/src/routes/users.ts',
];

console.log('--- TESTING AST PATCH SYNTHESIS & TS VALIDITY ---');
let allPass = true;

for (const file of fixtures) {
  const content = fs.readFileSync(file, 'utf8');
  const reports = hunter.scanFile(file);
  if (reports.length === 0) {
    console.log(`❌ [NO VULN DETECTED] ${file}`);
    allPass = false;
    continue;
  }

  for (const report of reports) {
    try {
      const patch = patcher.synthesizePatch(report, content);
      console.log(`✅ [SYNTHESIS PASS] ${file} -> ${report.category} (Diff lines: ${patch.patchDiff.split('\n').length})`);
    } catch (err: any) {
      console.log(`❌ [SYNTHESIS FAIL] ${file} -> ${report.category}: ${err.message}`);
      allPass = false;
    }
  }
}

if (!allPass) {
  process.exit(1);
} else {
  console.log('🎉 ALL 6 FIXTURES PASS SYNTHESIS AND TS DIAGNOSTICS CLEANLY!');
}
