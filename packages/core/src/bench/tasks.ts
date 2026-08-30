export interface BenchmarkTask {
  id: string;
  category:
    | "null_state"
    | "async_race"
    | "memory_leak"
    | "unhandled_promise"
    | "logic_type"
    | "timeout_deadlock"
    | "config_drift"
    | "data_corruption";
  difficulty: "easy" | "medium" | "hard";
  description: string;
  targetRepository: string;
  failingCommand: string;
  expectedDefectSignature: string;
  expectedCulpritFiles: string[];
  hiddenOracleCommand: string;
}

export const DEBUGFORGE_BENCH_TASKS: BenchmarkTask[] = [
  {
    id: "DF-001",
    category: "null_state",
    difficulty: "easy",
    description: "Database connection pool timeout returns undefined customer object causing TypeError in order dispatch.",
    targetRepository: "fixtures/null-propagation-api",
    failingCommand: "node src/index.js",
    expectedDefectSignature: "TypeError: Cannot read properties of undefined",
    expectedCulpritFiles: ["src/services/user-service.js"],
    hiddenOracleCommand: "node test/integration.test.js",
  },
  {
    id: "DF-002",
    category: "async_race",
    difficulty: "medium",
    description: "Unsynchronized parallel withdrawals lead to negative account balance race condition.",
    targetRepository: "fixtures/race-condition-app",
    failingCommand: "node test/race.test.js",
    expectedDefectSignature: "AssertionError: Balance went negative",
    expectedCulpritFiles: ["src/account.js"],
    hiddenOracleCommand: "node test/stress.test.js",
  },
  {
    id: "DF-003",
    category: "memory_leak",
    difficulty: "medium",
    description: "Unbounded in-memory session cache causes heap growth under high request volume.",
    targetRepository: "fixtures/memory-leak-server",
    failingCommand: "node src/server.js",
    expectedDefectSignature: "HeapGrowthExceeded: Memory leak detected",
    expectedCulpritFiles: ["src/cache.js"],
    hiddenOracleCommand: "node test/leak.test.js",
  },
  {
    id: "DF-004",
    category: "unhandled_promise",
    difficulty: "easy",
    description: "Missing catch block in background telemetry event emitter crashes process.",
    targetRepository: "fixtures/null-propagation-api",
    failingCommand: "node src/telemetry.js",
    expectedDefectSignature: "UnhandledPromiseRejection: Missing catch block in telemetry",
    expectedCulpritFiles: ["src/telemetry.js"],
    hiddenOracleCommand: "node test/telemetry.test.js",
  },
  {
    id: "DF-005",
    category: "logic_type",
    difficulty: "easy",
    description: "String concatenation vs numeric addition in pagination offset calculation.",
    targetRepository: "fixtures/null-propagation-api",
    failingCommand: "node src/pagination.js",
    expectedDefectSignature: "AssertionError: Page offset incorrect",
    expectedCulpritFiles: ["src/pagination.js"],
    hiddenOracleCommand: "node test/pagination.test.js",
  },
];
