import { Scenario } from '../types';

export const SCENARIOS: Record<string, Scenario> = {
  'null-propagation': {
    id: 'null-propagation',
    name: 'Null Cascade in Order API',
    badge: 'fixtures/null-propagation-api',
    description: 'A DB connection pool timeout returns null without throwing, propagating silently through inventory and pricing before throwing TypeError at invoice formatting.',
    fixturePath: 'fixtures/null-propagation-api',
    crashSite: 'src/services/order.ts:42 (order.pricing.total.toFixed)',
    rootCause: 'src/db/pool.ts:24 (acquireConnection timeout returning null)',
    tripleLock: {
      lock1: {
        name: 'Lock 1: Reproduction Test',
        target: 'npm test -- test/order.test.ts',
        description: 'Original failing order checkout scenario',
        status: 'passed',
        duration: '210ms'
      },
      lock2: {
        name: 'Lock 2: Full Regression Suite',
        target: 'npm test -- src/**/*.test.ts',
        description: '48 existing unit & integration tests',
        status: 'passed',
        duration: '1.18s'
      },
      lock3: {
        name: 'Lock 3: Concurrency Stress Test',
        target: 'npm run test:stress -- --concurrency 50',
        description: '50 parallel checkout requests under pool exhaustion',
        status: 'passed',
        duration: '2.04s'
      }
    },
    prSummary: {
      prNumber: 42,
      title: 'fix(db): handle pool acquisition timeout and propagate connection error',
      qodoReview: 'Approved: 100% test pass, 0 regressions, clean error boundary in pool.ts',
      qodoScore: 99,
      timeToHeal: '1m 12s',
      branch: 'fix/pool-timeout-null-cascade'
    },
    logs: [
      {
        id: 'log-1',
        stepIndex: 1,
        timestamp: '14:22:01.102',
        phase: 'INFO',
        content: 'DebugForge v1.0.0 — Autonomous AI Debugging Harness initialized.'
      },
      {
        id: 'log-2',
        stepIndex: 2,
        timestamp: '14:22:01.180',
        phase: 'ACT',
        toolName: 'ingest_error',
        toolArgs: {
          testCommand: 'npm test',
          cwd: 'fixtures/null-propagation-api'
        },
        content: 'Executing ingest_error on failing test output...'
      },
      {
        id: 'log-3',
        stepIndex: 3,
        timestamp: '14:22:01.320',
        phase: 'OBSERVE',
        content: 'Captured TypeError: Cannot read properties of undefined (reading \'toFixed\')\n  at formatInvoice (src/services/order.ts:42:35)\n  at processOrder (src/services/order.ts:18:12)\n  at TestContext.<anonymous> (test/order.test.ts:34:5)'
      },
      {
        id: 'log-4',
        stepIndex: 4,
        timestamp: '14:22:01.450',
        phase: 'THINK',
        content: 'Crash occurred at order.ts:42 due to order.pricing.total being undefined. I need to reproduce this deterministically in an isolated Daytona sandbox.'
      },
      {
        id: 'log-5',
        stepIndex: 5,
        timestamp: '14:22:01.610',
        phase: 'ACT',
        toolName: 'reproduce_in_sandbox',
        toolArgs: {
          provider: 'daytona',
          workspace: 'fixtures/null-propagation-api',
          command: 'npm test -- test/order.test.ts'
        },
        content: 'Spun up Daytona ephemeral workspace [daytona-ws-901b-c72]. Running reproduction command...'
      },
      {
        id: 'log-6',
        stepIndex: 6,
        timestamp: '14:22:02.820',
        phase: 'OBSERVE',
        content: 'Sandbox execution complete. Exit Code: 1 (FAIL). Deterministic reproduction confirmed in 842ms.'
      },
      {
        id: 'log-7',
        stepIndex: 7,
        timestamp: '14:22:02.940',
        phase: 'THINK',
        content: 'Crash site is order.ts:42, but pricing was calculated in pricing.ts from item data retrieved via inventory.ts and db/pool.ts. Executing dynamic backward causal tracing.'
      },
      {
        id: 'log-8',
        stepIndex: 8,
        timestamp: '14:22:03.110',
        phase: 'ACT',
        toolName: 'trace_and_analyze',
        toolArgs: {
          crashFile: 'src/services/order.ts',
          crashLine: 42,
          variable: 'order.pricing.total'
        },
        content: 'Tracing data-flow dependencies backwards from order.ts:42 across AST call graph...'
      },
      {
        id: 'log-9',
        stepIndex: 9,
        timestamp: '14:22:03.580',
        phase: 'OBSERVE',
        content: 'Causal Chain Resolved (4 hops):\n  [1] src/db/pool.ts:24 -> acquireConnection() returns { connection: null } on pool timeout\n  [2] src/services/inventory.ts:16 -> getItemStock() receives null conn, returns null item\n  [3] src/services/pricing.ts:28 -> calculatePricing() receives null item, sets total to undefined\n  [4] src/services/order.ts:42 -> CRASH SITE: Calling .toFixed(2) on undefined'
      },
      {
        id: 'log-10',
        stepIndex: 10,
        timestamp: '14:22:03.750',
        phase: 'THINK',
        content: 'Infection Origin identified at src/db/pool.ts:24. The pool acquisition fails silently instead of throwing or retrying. Synthesizing surgical AST patch with connection timeout error boundary.'
      },
      {
        id: 'log-11',
        stepIndex: 11,
        timestamp: '14:22:04.050',
        phase: 'ACT',
        toolName: 'auto_patch_and_verify',
        toolArgs: {
          targetFile: 'src/db/pool.ts',
          strategy: 'AST_THROW_ON_POOL_TIMEOUT'
        },
        content: 'Synthesizing AST patch and executing Triple-Lock differential verification in sandbox...'
      },
      {
        id: 'log-12',
        stepIndex: 12,
        timestamp: '14:22:05.420',
        phase: 'DIFF',
        content: 'Generated AST Patch for src/db/pool.ts',
        diff: {
          file: 'src/db/pool.ts',
          additions: 5,
          deletions: 2,
          lines: [
            { type: 'context', oldLine: 22, newLine: 22, content: '  async acquireConnection(): Promise<DbConnection> {' },
            { type: 'context', oldLine: 23, newLine: 23, content: '    const conn = await this.pool.getConnection({ timeout: 5000 });' },
            { type: 'delete', oldLine: 24, content: '    if (!conn) return null as unknown as DbConnection;' },
            { type: 'delete', oldLine: 25, content: '    return conn;' },
            { type: 'add', newLine: 24, content: '    if (!conn) {' },
            { type: 'add', newLine: 25, content: '      throw new DatabasePoolTimeoutError("Connection pool timed out after 5000ms");' },
            { type: 'add', newLine: 26, content: '    }' },
            { type: 'add', newLine: 27, content: '    return conn;' },
            { type: 'context', oldLine: 26, newLine: 28, content: '  }' }
          ]
        }
      },
      {
        id: 'log-13',
        stepIndex: 13,
        timestamp: '14:22:06.100',
        phase: 'LOCK',
        content: 'Triple-Lock Verification Status:\n  [✓] Lock 1 (Reproduction Test): PASS (210ms)\n  [✓] Lock 2 (Regression Suite - 48 tests): PASS (1.18s, 0 regressions)\n  [✓] Lock 3 (50-Client Concurrency Stress): PASS (2.04s, 0 leaks)'
      },
      {
        id: 'log-14',
        stepIndex: 14,
        timestamp: '14:22:06.320',
        phase: 'HITL',
        hitlAction: true,
        content: 'TrueForge HITL Gatekeeper: Patch verified with 100% confidence. Awaiting human decision: [Approve & Open PR] / [Edit Patch] / [Reject]'
      },
      {
        id: 'log-15',
        stepIndex: 15,
        timestamp: '14:22:07.150',
        phase: 'SUCCESS',
        content: 'PR #42 opened: "fix(db): handle pool acquisition timeout and propagate connection error"\nQodo PR-Agent automated review: APPROVED (Score: 99/100, 0 security advisories).'
      }
    ]
  },
  'race-condition': {
    id: 'race-condition',
    name: 'Async Race Condition in Wallet App',
    badge: 'fixtures/race-condition-app',
    description: 'Concurrent async transfer requests read outdated balance before previous writes commit, allowing double-spends and reducing balance to -$900.',
    fixturePath: 'fixtures/race-condition-app',
    crashSite: 'test/concurrency.test.ts:38 (Assertion: balance >= 0 failed with -900)',
    rootCause: 'src/wallet/account.ts:18 (non-atomic async read-modify-write)',
    tripleLock: {
      lock1: {
        name: 'Lock 1: Reproduction Test',
        target: 'npm test -- test/concurrency.test.ts',
        description: '20 parallel transfers of $50 from $100 balance',
        status: 'passed',
        duration: '310ms'
      },
      lock2: {
        name: 'Lock 2: Full Regression Suite',
        target: 'npm test -- src/**/*.test.ts',
        description: '36 existing wallet & ledger tests',
        status: 'passed',
        duration: '890ms'
      },
      lock3: {
        name: 'Lock 3: High-Stress Race Harness',
        target: 'npm run test:stress -- --workers 100',
        description: '100 parallel workers competing for balance updates',
        status: 'passed',
        duration: '1.75s'
      }
    },
    prSummary: {
      prNumber: 43,
      title: 'fix(wallet): introduce per-account async mutex lock on balance debit',
      qodoReview: 'Approved: Perfect synchronization, 0 race conditions under 100-worker concurrency',
      qodoScore: 98,
      timeToHeal: '1m 48s',
      branch: 'fix/wallet-async-mutex-lock'
    },
    logs: [
      {
        id: 'rc-1',
        stepIndex: 1,
        timestamp: '15:10:00.010',
        phase: 'INFO',
        content: 'Ingesting test failure from fixtures/race-condition-app...'
      },
      {
        id: 'rc-2',
        stepIndex: 2,
        timestamp: '15:10:00.120',
        phase: 'ACT',
        toolName: 'ingest_error',
        toolArgs: { testCommand: 'npm test' },
        content: 'Analyzing concurrency test assertion failure...'
      },
      {
        id: 'rc-3',
        stepIndex: 3,
        timestamp: '15:10:00.290',
        phase: 'OBSERVE',
        content: 'AssertionError: Expected account.balance >= 0 (received -900). 20 concurrent transactions succeeded from a $100 initial balance.'
      },
      {
        id: 'rc-4',
        stepIndex: 4,
        timestamp: '15:10:00.410',
        phase: 'THINK',
        content: 'Classic time-of-check to time-of-use (TOCTOU) race condition in asynchronous account balance deduction. Starting isolated Daytona sandbox reproduction.'
      },
      {
        id: 'rc-5',
        stepIndex: 5,
        timestamp: '15:10:00.600',
        phase: 'ACT',
        toolName: 'reproduce_in_sandbox',
        toolArgs: {
          provider: 'daytona',
          workspace: 'fixtures/race-condition-app',
          command: 'npm test'
        },
        content: 'Executing reproduction in Daytona sandbox container [daytona-ws-441f-e19]...'
      },
      {
        id: 'rc-6',
        stepIndex: 6,
        timestamp: '15:10:01.400',
        phase: 'OBSERVE',
        content: 'Deterministic reproduction confirmed. Exit Code: 1. Negative balance reproduced (-$900).'
      },
      {
        id: 'rc-7',
        stepIndex: 7,
        timestamp: '15:10:01.550',
        phase: 'ACT',
        toolName: 'trace_and_analyze',
        toolArgs: {
          crashFile: 'test/concurrency.test.ts',
          crashLine: 38,
          variable: 'account.balance'
        },
        content: 'Analyzing async execution schedule and interleaving ticks in AccountManager...'
      },
      {
        id: 'rc-8',
        stepIndex: 8,
        timestamp: '15:10:01.950',
        phase: 'OBSERVE',
        content: 'Infection Origin: src/wallet/account.ts:18\nAsync gap detected between `await this.getBalance()` and `await this.setBalance()`. Interleaved audit log `await auditLogger.logAsyncTransfer()` allows concurrent reads before write commits.'
      },
      {
        id: 'rc-9',
        stepIndex: 9,
        timestamp: '15:10:02.100',
        phase: 'THINK',
        content: 'Synthesizing AST patch to wrap account debit operations in a fine-grained per-account AsyncMutex queue, ensuring serialized atomic transactions.'
      },
      {
        id: 'rc-10',
        stepIndex: 10,
        timestamp: '15:10:02.350',
        phase: 'ACT',
        toolName: 'auto_patch_and_verify',
        toolArgs: {
          targetFile: 'src/wallet/account.ts',
          strategy: 'AST_MUTEX_QUEUE_SERIALIZATION'
        },
        content: 'Applying AsyncMutex serialization patch and running Triple-Lock verification...'
      },
      {
        id: 'rc-11',
        stepIndex: 11,
        timestamp: '15:10:03.200',
        phase: 'DIFF',
        content: 'Generated AST Patch for src/wallet/account.ts',
        diff: {
          file: 'src/wallet/account.ts',
          additions: 8,
          deletions: 2,
          lines: [
            { type: 'context', oldLine: 16, newLine: 16, content: '  async debit(accountId: string, amount: number): Promise<boolean> {' },
            { type: 'delete', oldLine: 17, content: '    const balance = await this.getBalance(accountId);' },
            { type: 'delete', oldLine: 18, content: '    if (balance < amount) return false;' },
            { type: 'add', newLine: 17, content: '    return this.mutex.runExclusive(accountId, async () => {' },
            { type: 'add', newLine: 18, content: '      const balance = await this.getBalance(accountId);' },
            { type: 'add', newLine: 19, content: '      if (balance < amount) return false;' },
            { type: 'add', newLine: 20, content: '      await auditLogger.logAsyncTransfer(accountId, amount);' },
            { type: 'add', newLine: 21, content: '      await this.setBalance(accountId, balance - amount);' },
            { type: 'add', newLine: 22, content: '      return true;' },
            { type: 'add', newLine: 23, content: '    });' },
            { type: 'context', oldLine: 22, newLine: 24, content: '  }' }
          ]
        }
      },
      {
        id: 'rc-12',
        stepIndex: 12,
        timestamp: '15:10:04.100',
        phase: 'LOCK',
        content: 'Triple-Lock Verification Complete:\n  [✓] Lock 1 (Reproduction): PASS (Only exactly 2 transfers succeeded, final balance: $0)\n  [✓] Lock 2 (Regression Suite - 36 tests): PASS (0 regressions)\n  [✓] Lock 3 (100-Worker Concurrency Stress): PASS (0 negative balances)'
      },
      {
        id: 'rc-13',
        stepIndex: 13,
        timestamp: '15:10:04.300',
        phase: 'HITL',
        hitlAction: true,
        content: 'HITL Gate: Concurrency patch verified with zero race conditions. Awaiting human approval.'
      },
      {
        id: 'rc-14',
        stepIndex: 14,
        timestamp: '15:10:05.100',
        phase: 'SUCCESS',
        content: 'PR #43 opened: "fix(wallet): introduce per-account async mutex lock on balance debit"\nQodo PR-Agent score: 98/100.'
      }
    ]
  },
  'memory-leak': {
    id: 'memory-leak',
    name: 'Unbounded Event Listener Leak in Telemetry Server',
    badge: 'fixtures/memory-leak-server',
    description: 'Server registers per-connection listeners on a global EventEmitter and buffers metrics into an unbounded Map without disposal lifecycle cleanup.',
    fixturePath: 'fixtures/memory-leak-server',
    crashSite: 'test/leak.test.ts:44 (Assertion: listenerCount === 0 failed with 1000)',
    rootCause: 'src/server/session.ts:22 (missing listener removal and cache eviction)',
    tripleLock: {
      lock1: {
        name: 'Lock 1: Reproduction Test',
        target: 'npm test -- test/leak.test.ts',
        description: '1,000 synthetic connect/disconnect cycles',
        status: 'passed',
        duration: '420ms'
      },
      lock2: {
        name: 'Lock 2: Full Regression Suite',
        target: 'npm test -- src/**/*.test.ts',
        description: '24 telemetry streaming tests',
        status: 'passed',
        duration: '760ms'
      },
      lock3: {
        name: 'Lock 3: Heap Retention Stress Test',
        target: 'npm run test:heap -- --cycles 10000',
        description: '10,000 connections with garbage collector heap delta assertion (< 2MB)',
        status: 'passed',
        duration: '2.80s'
      }
    },
    prSummary: {
      prNumber: 44,
      title: 'fix(server): implement Session.destroy() lifecycle cleanup and WeakMap cache',
      qodoReview: 'Approved: 0 dangling listeners, heap memory bounded at O(1) active connections',
      qodoScore: 100,
      timeToHeal: '2m 05s',
      branch: 'fix/telemetry-memory-leak'
    },
    logs: [
      {
        id: 'ml-1',
        stepIndex: 1,
        timestamp: '16:05:00.005',
        phase: 'INFO',
        content: 'Ingesting failure logs from fixtures/memory-leak-server...'
      },
      {
        id: 'ml-2',
        stepIndex: 2,
        timestamp: '16:05:00.100',
        phase: 'ACT',
        toolName: 'ingest_error',
        toolArgs: { testCommand: 'npm test' },
        content: 'Parsing memory test failure and event listener warnings...'
      },
      {
        id: 'ml-3',
        stepIndex: 3,
        timestamp: '16:05:00.280',
        phase: 'OBSERVE',
        content: '(node:49102) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 1001 telemetry listeners added to [MetricsEmitter]. Use emitter.setMaxListeners() to increase limit.'
      },
      {
        id: 'ml-4',
        stepIndex: 4,
        timestamp: '16:05:00.420',
        phase: 'THINK',
        content: 'Memory leak caused by uncleaned EventEmitter listeners and unbounded Map retention in session lifecycle. Reproducing in isolated Daytona sandbox.'
      },
      {
        id: 'ml-5',
        stepIndex: 5,
        timestamp: '16:05:00.600',
        phase: 'ACT',
        toolName: 'reproduce_in_sandbox',
        toolArgs: {
          provider: 'daytona',
          workspace: 'fixtures/memory-leak-server',
          command: 'npm test'
        },
        content: 'Running memory leak test harness in Daytona container [daytona-ws-718a-f03]...'
      },
      {
        id: 'ml-6',
        stepIndex: 6,
        timestamp: '16:05:01.350',
        phase: 'OBSERVE',
        content: 'Sandbox Exit Code: 1. MaxListenersExceededWarning confirmed with 1000 dangling listener references.'
      },
      {
        id: 'ml-7',
        stepIndex: 7,
        timestamp: '16:05:01.500',
        phase: 'ACT',
        toolName: 'trace_and_analyze',
        toolArgs: {
          crashFile: 'test/leak.test.ts',
          crashLine: 44,
          variable: 'globalMetricsEmitter.listenerCount'
        },
        content: 'Tracing listener allocation origin and reference graph...'
      },
      {
        id: 'ml-8',
        stepIndex: 8,
        timestamp: '16:05:01.900',
        phase: 'OBSERVE',
        content: 'Infection Origin: src/server/session.ts:22\n`ClientSession.constructor` registers `globalEmitter.on("telemetry", this.onMetric)` without corresponding `this.destroy()` or `off()` handler when connection closes.'
      },
      {
        id: 'ml-9',
        stepIndex: 9,
        timestamp: '16:05:02.150',
        phase: 'ACT',
        toolName: 'auto_patch_and_verify',
        toolArgs: {
          targetFile: 'src/server/session.ts',
          strategy: 'AST_LIFECYCLE_DISPOSAL_PATTERN'
        },
        content: 'Synthesizing disposal lifecycle and running Triple-Lock verification...'
      },
      {
        id: 'ml-10',
        stepIndex: 10,
        timestamp: '16:05:03.100',
        phase: 'DIFF',
        content: 'Generated AST Patch for src/server/session.ts',
        diff: {
          file: 'src/server/session.ts',
          additions: 9,
          deletions: 1,
          lines: [
            { type: 'context', oldLine: 20, newLine: 20, content: 'export class ClientSession {' },
            { type: 'context', oldLine: 21, newLine: 21, content: '  private readonly metricHandler = (data: Metric) => this.process(data);' },
            { type: 'context', oldLine: 22, newLine: 22, content: '  constructor(public id: string) {' },
            { type: 'delete', oldLine: 23, content: '    globalMetricsEmitter.on("telemetry", (data) => this.process(data));' },
            { type: 'add', newLine: 23, content: '    globalMetricsEmitter.on("telemetry", this.metricHandler);' },
            { type: 'context', oldLine: 24, newLine: 24, content: '  }' },
            { type: 'add', newLine: 25, content: '  destroy(): void {' },
            { type: 'add', newLine: 26, content: '    globalMetricsEmitter.off("telemetry", this.metricHandler);' },
            { type: 'add', newLine: 27, content: '    telemetryCache.delete(this.id);' },
            { type: 'add', newLine: 28, content: '  }' },
            { type: 'context', oldLine: 25, newLine: 29, content: '}' }
          ]
        }
      },
      {
        id: 'ml-11',
        stepIndex: 11,
        timestamp: '16:05:04.200',
        phase: 'LOCK',
        content: 'Triple-Lock Verification Passed:\n  [✓] Lock 1 (Reproduction): PASS (0 dangling listeners after 1,000 disconnects)\n  [✓] Lock 2 (Regression Suite - 24 tests): PASS (0 regressions)\n  [✓] Lock 3 (10,000 Connection Heap Stress): PASS (Heap growth < 120KB, constant O(1))'
      },
      {
        id: 'ml-12',
        stepIndex: 12,
        timestamp: '16:05:04.400',
        phase: 'HITL',
        hitlAction: true,
        content: 'HITL Gate: Memory leak fix verified with zero heap growth. Awaiting approval.'
      },
      {
        id: 'ml-13',
        stepIndex: 13,
        timestamp: '16:05:05.100',
        phase: 'SUCCESS',
        content: 'PR #44 opened: "fix(server): implement Session.destroy() lifecycle cleanup and WeakMap cache"\nQodo PR-Agent: 100/100 (Clean memory bounds).'
      }
    ]
  }
};
