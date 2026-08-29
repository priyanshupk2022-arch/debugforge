/**
 * DebugForge E2E Test Suite Runner
 * Executes Tier 1, Tier 2, Tier 3, and Tier 4 test suites with detailed reporting.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// Parse CLI flags
const args = process.argv.slice(2);
let tierFilter = null;
let nameFilter = null;
let verbose = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--tier' && args[i + 1]) {
    tierFilter = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--filter' && args[i + 1]) {
    nameFilter = args[i + 1].toLowerCase();
    i++;
  } else if (args[i] === '--verbose' || args[i] === '-v') {
    verbose = true;
  }
}

const testsRootDir = __dirname;
const tiers = [
  { id: 1, name: 'Tier 1: Feature Coverage (F1 - F22)', dir: path.join(testsRootDir, 'tier1-features') },
  { id: 2, name: 'Tier 2: Boundary & Corner Cases', dir: path.join(testsRootDir, 'tier2-boundaries') },
  { id: 3, name: 'Tier 3: Cross-Feature Integration Pipelines', dir: path.join(testsRootDir, 'tier3-integration') },
  { id: 4, name: 'Tier 4: Real-World Application Scenarios', dir: path.join(testsRootDir, 'tier4-realworld') },
];

console.log('\n======================================================================');
console.log('⚡ DEBUGFORGE AUTOMATED E2E TEST SUITE RUNNER');
console.log('======================================================================\n');

let totalSuites = 0;
let passedSuites = 0;
let failedSuites = 0;
const tierSummaries = [];
const startTime = Date.now();

for (const tier of tiers) {
  if (tierFilter && tierFilter !== tier.id) continue;
  if (!fs.existsSync(tier.dir)) continue;

  const files = fs.readdirSync(tier.dir)
    .filter(f => f.endsWith('.test.js'))
    .filter(f => !nameFilter || f.toLowerCase().includes(nameFilter));

  if (files.length === 0) continue;

  console.log(`\n📦 ${tier.name} (${files.length} test files):`);
  console.log('─'.repeat(70));

  let tierPassed = 0;
  let tierFailed = 0;

  for (const file of files) {
    totalSuites++;
    const fullPath = path.join(tier.dir, file);
    const testStart = Date.now();

    const res = spawnSync('node', ['--test', fullPath], {
      cwd: path.resolve(testsRootDir, '..'),
      encoding: 'utf8',
      env: { ...process.env },
    });

    const duration = Date.now() - testStart;
    const isPass = res.status === 0;

    if (isPass) {
      passedSuites++;
      tierPassed++;
      console.log(`  ✅ PASS  ${file} (${duration}ms)`);
      if (verbose && res.stdout) {
        console.log(res.stdout.split('\n').map(l => `     ${l}`).join('\n'));
      }
    } else {
      failedSuites++;
      tierFailed++;
      console.log(`  ❌ FAIL  ${file} (${duration}ms)`);
      console.log('─'.repeat(50));
      if (res.stdout) console.log(res.stdout);
      if (res.stderr) console.error(res.stderr);
      console.log('─'.repeat(50));
    }
  }

  tierSummaries.push({
    id: tier.id,
    name: tier.name,
    total: files.length,
    passed: tierPassed,
    failed: tierFailed,
  });
}

const totalDuration = Date.now() - startTime;

console.log('\n======================================================================');
console.log('📊 TEST EXECUTION SUMMARY DASHBOARD');
console.log('======================================================================');
for (const s of tierSummaries) {
  const icon = s.failed === 0 ? '✅' : '❌';
  console.log(`${icon} ${s.name.padEnd(50)} : ${s.passed}/${s.total} files passed`);
}
console.log('─'.repeat(70));
console.log(`Total Test Suites : ${totalSuites}`);
console.log(`Passed Suites     : ${passedSuites}`);
console.log(`Failed Suites     : ${failedSuites}`);
console.log(`Total Duration    : ${totalDuration}ms`);
console.log(`Final Result      : ${failedSuites === 0 ? '🟢 ALL TESTS PASSED' : '🔴 TESTS FAILED'}`);
console.log('======================================================================\n');

process.exit(failedSuites === 0 ? 0 : 1);
