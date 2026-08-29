/**
 * DebugForge Test Harness - Test Utilities & Custom Assertions
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');

/**
 * Creates an isolated temporary directory workspace populated with files
 * @param {Record<string, string>} files - Object mapping relative file paths to content
 * @returns {string} Absolute path to created temp directory
 */
function createTempWorkspace(files = {}) {
  const prefix = path.join(os.tmpdir(), `debugforge_test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`);
  fs.mkdirSync(prefix, { recursive: true });

  for (const [relPath, content] of Object.entries(files)) {
    const fullPath = path.join(prefix, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf8');
  }

  return prefix;
}

/**
 * Clean up a temporary workspace directory safely
 * @param {string} dirPath 
 */
function cleanTempWorkspace(dirPath) {
  if (dirPath && fs.existsSync(dirPath)) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
    } catch (e) {
      // Best effort cleanup
    }
  }
}

/**
 * Strips ANSI escape codes from terminal strings
 * @param {string} str 
 * @returns {string} Clean string
 */
function stripAnsi(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}

/**
 * Validates unified diff structure
 * @param {string} diff 
 * @returns {boolean}
 */
function assertUnifiedDiffValid(diff) {
  assert(typeof diff === 'string', 'Diff must be a string');
  assert(diff.length > 0, 'Diff must not be empty');
  
  const lines = diff.split('\n');
  const hasOldFileHeader = lines.some(l => l.startsWith('--- '));
  const hasNewFileHeader = lines.some(l => l.startsWith('+++ '));
  const hasHunkHeader = lines.some(l => /^@@ -\d+(,\d+)? \+\d+(,\d+)? @@/.test(l));
  const hasAdditions = lines.some(l => l.startsWith('+') && !l.startsWith('+++'));
  
  assert(hasOldFileHeader, 'Diff must contain old file header (---)');
  assert(hasNewFileHeader, 'Diff must contain new file header (+++)');
  assert(hasHunkHeader, 'Diff must contain hunk header (@@)');
  assert(hasAdditions, 'Diff must contain added lines (+)');
  return true;
}

/**
 * Validates Causal Graph DAG properties (no self-loops, valid path from origin to crash site)
 * @param {import('./contracts').CausalTraceGraph} graph 
 */
function assertCausalDAGValid(graph) {
  assert(graph.rootCause, 'Graph must have rootCause node');
  assert(graph.crashSite, 'Graph must have crashSite node');
  assert(graph.rootCause.type === 'INFECTION_ORIGIN', 'rootCause node type must be INFECTION_ORIGIN');
  assert(graph.crashSite.type === 'CRASH_SITE', 'crashSite node type must be CRASH_SITE');
  assert(Array.isArray(graph.propagationPath), 'propagationPath must be an array');
  
  // Verify nodes are distinct
  const nodeIds = new Set();
  nodeIds.add(graph.rootCause.id);
  
  for (const propNode of graph.propagationPath) {
    assert(!nodeIds.has(propNode.id), `Duplicate node ID in propagation path: ${propNode.id}`);
    assert(propNode.type === 'PROPAGATION_STEP', 'Intermediate node type must be PROPAGATION_STEP');
    nodeIds.add(propNode.id);
  }
  
  assert(!nodeIds.has(graph.crashSite.id) || graph.rootCause.id === graph.crashSite.id, 'Crash site ID must be distinct or single-node');
  assert(graph.confidence >= 0 && graph.confidence <= 1, 'Confidence must be between 0 and 1');
  assert(graph.graphAscii && graph.graphAscii.length > 0, 'graphAscii visualization must be present');
  return true;
}

/**
 * Generates sample V8 Node stack trace
 */
function generateV8StackTrace(errorType, message, frames) {
  const header = `${errorType}: ${message}`;
  const frameLines = frames.map(f => `    at ${f.functionName || 'Object.<anonymous>'} (${f.file}:${f.line}:${f.column || 1})`);
  return [header, ...frameLines].join('\n');
}

/**
 * Asserts TripleLock results
 */
function assertTripleLockPassed(tripleLock) {
  assert(tripleLock.lock1_targetTest.passed === true, 'Lock 1 (Target Test) must pass');
  assert(tripleLock.lock2_fullSuite.passed === true, 'Lock 2 (Full Suite) must pass');
  assert(tripleLock.lock3_stressTest.passed === true, 'Lock 3 (Stress Test) must pass');
  assert(tripleLock.allPassed === true, 'TripleLock allPassed must be true');
  assert(tripleLock.score === 100, 'TripleLock score must be 100 on allPassed');
}

module.exports = {
  createTempWorkspace,
  cleanTempWorkspace,
  stripAnsi,
  assertUnifiedDiffValid,
  assertCausalDAGValid,
  generateV8StackTrace,
  assertTripleLockPassed,
};
