import * as path from 'path';
import {
  VulnerabilityHunter,
  RedAgentArena,
  BlueAgentImmunizer,
  ImmunizationVerifier,
  SandboxFactory,
  findProjectRoot,
} from '../packages/core/dist/src/index.js';

const fixtures = [
  { name: 'Payment (CWE-78)', dir: 'fixtures/vulnerable-payment-app', port: 7002 },
  { name: 'ProtoPollution (CWE-1321)', dir: 'fixtures/vulnerable-prototype-pollution', port: 7004 },
  { name: 'JWT Auth (CWE-287)', dir: 'fixtures/vulnerable-jwt-auth', port: 7006 },
  { name: 'SSRF (CWE-918)', dir: 'fixtures/vulnerable-ssrf-app', port: 7008 },
  { name: 'Path Traversal (CWE-22)', dir: 'fixtures/vulnerable-path-traversal', port: 7010 },
  { name: 'SQL Injection (CWE-89)', dir: 'fixtures/vulnerable-sql-injection', port: 7012 },
];

async function diagnoseFixture(fix: { name: string; dir: string; port: number }) {
  console.log(`\n======================================================`);
  console.log(`🔍 DIAGNOSING: ${fix.name} (${fix.dir}) on Port ${fix.port}`);
  console.log(`======================================================`);

  const resolvedDir = path.resolve(fix.dir);
  const hunter = new VulnerabilityHunter();
  const redAgent = new RedAgentArena();
  const blueAgent = new BlueAgentImmunizer();
  const verifier = new ImmunizationVerifier();

  // Step 1: Hunter scan
  const reports = hunter.scanDirectory(resolvedDir);
  console.log(`[Step 1] Sinks Discovered: ${reports.length}`);
  if (reports.length === 0) {
    console.log(`❌ FAIL at Step 1: No sinks found.`);
    return;
  }
  const report = reports[0];
  console.log(`   Sink: ${report.category} (${report.cwe})`);
  console.log(`   Exploit Spec:`, JSON.stringify(report.exploitPayloadSpec));

  // Step 2: Sandbox lifecycle
  const sandbox = await SandboxFactory.createSandbox({
    sourceDir: resolvedDir,
    port: fix.port,
    forceLocal: true,
  });

  try {
    console.log(`[Step 2] Starting Service in Sandbox...`);
    await sandbox.startService('src/server.ts');
    console.log(`✅ Sandbox Service Started & Bound.`);

    // Step 3: Exploit Proof
    console.log(`[Step 3] Firing Red Agent Exploit...`);
    const exploitResult = await redAgent.executeExploitInSandbox(report, sandbox);
    console.log(`   Exploit Confirmed: ${exploitResult.exploitConfirmed} (Status: ${exploitResult.statusCode}, Body: ${exploitResult.capturedProof.substring(0, 100)})`);
    if (!exploitResult.exploitConfirmed) {
      console.log(`❌ FAIL at Step 3: Red Agent failed to prove exploit.`);
    }

    // Step 4: Patch Synthesis
    console.log(`[Step 4] Synthesizing Blue Agent AVO Patch...`);
    const originalContent = await sandbox.readFile(path.relative(findProjectRoot(report.vulnerableFilePath), report.vulnerableFilePath));
    const patch = blueAgent.synthesizePatch(report, originalContent);
    console.log(`✅ Patch Synthesized. Digest: ${patch.patchDigest.substring(0, 8)}, Diff lines: ${patch.patchDiff.split('\n').length}`);

    // Step 5: Verification in Sandbox
    console.log(`[Step 5] Applying Patch & Running Triple-Lock Verification...`);
    const verified = await verifier.verifyPatchInSandbox(report, patch, sandbox);
    console.log(`   Triple Lock Results:`);
    console.log(`   - Lock 1 (Exploit Blocked):        ${verified.immunizationResults.exploitBlocked ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   - Lock 2 (Golden Preserved):        ${verified.immunizationResults.goldenInputsPreserved ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   - Lock 3 (Unit Tests Pass):        ${verified.immunizationResults.unitTestsPassed ? '✅ PASS' : '❌ FAIL'} (Exit: ${verified.immunizationResults.testSuiteExitCode})`);
    if (!verified.immunizationResults.unitTestsPassed) {
      console.log(`   [Test Output]:`, verified.immunizationResults.testSuiteOutput);
    }
    console.log(`   Final Status: ${verified.status} (CVSS: ${report.cvssBaseScore} -> ${verified.resultingCvssScore})`);
  } catch (err: any) {
    console.error(`❌ Exception during diagnosis:`, err);
  } finally {
    await sandbox.destroy();
  }
}

async function runAll() {
  for (const f of fixtures) {
    await diagnoseFixture(f);
  }
}

runAll().catch(console.error);
