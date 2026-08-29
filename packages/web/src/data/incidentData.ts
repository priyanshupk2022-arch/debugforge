import { Incident } from '../types';

export const INCIDENTS_DATA: Incident[] = [
  {
    id: 'INC-8921',
    service: 'checkout-billing-service',
    errorType: 'TypeError: Cannot read properties of undefined (reading \'toFixed\')',
    message: 'Unhandled null cascade in order pricing calculation after DB pool timeout',
    timestamp: '2 mins ago',
    status: 'HEALED',
    mttr: '1m 12s',
    locksPassed: 3,
    sandboxId: 'daytona-ws-901b-c72',
    causalTrace: [
      { node: 'ConnectionPool.acquire()', file: 'src/db/pool.ts', line: 24, role: 'origin', desc: 'Pool timeout returned null without throwing exception' },
      { node: 'InventoryService.getStock()', file: 'src/services/inventory.ts', line: 16, role: 'propagation', desc: 'Null connection yielded null inventory item' },
      { node: 'PricingCalculator.calculate()', file: 'src/services/pricing.ts', line: 28, role: 'propagation', desc: 'Returned undefined total amount' },
      { node: 'OrderService.formatInvoice()', file: 'src/services/order.ts', line: 42, role: 'crash', desc: 'Crashed on calling .toFixed(2) on undefined' }
    ]
  },
  {
    id: 'INC-8922',
    service: 'wallet-ledger-worker',
    errorType: 'AssertionError: balance >= 0 (received -900)',
    message: 'Concurrent debit operations corrupted account balance under 20 parallel requests',
    timestamp: '8 mins ago',
    status: 'HEALED',
    mttr: '1m 48s',
    locksPassed: 3,
    sandboxId: 'daytona-ws-441f-e19',
    causalTrace: [
      { node: 'AccountManager.debit()', file: 'src/wallet/account.ts', line: 18, role: 'origin', desc: 'Non-atomic read-modify-write interleaving across async ticks' },
      { node: 'AuditLogger.logTransfer()', file: 'src/services/transfer.ts', line: 22, role: 'propagation', desc: 'Async delay allowed parallel reads before write committed' },
      { node: 'AccountManager.save()', file: 'src/wallet/account.ts', line: 31, role: 'crash', desc: 'Multiple debits subtracted balance into negative balance (-$900)' }
    ]
  },
  {
    id: 'INC-8923',
    service: 'telemetry-stream-gateway',
    errorType: 'MaxListenersExceededWarning: 1000 listeners allocated',
    message: 'Unbounded EventEmitter listener registration without connection lifecycle cleanup',
    timestamp: '15 mins ago',
    status: 'HEALED',
    mttr: '2m 05s',
    locksPassed: 3,
    sandboxId: 'daytona-ws-718a-f03',
    causalTrace: [
      { node: 'ClientSession.constructor', file: 'src/server/session.ts', line: 22, role: 'origin', desc: 'Registered global EventEmitter listener without disposal hook' },
      { node: 'TelemetryCache.set()', file: 'src/server/cache.ts', line: 14, role: 'propagation', desc: 'Unbounded Map retained large 64KB buffer per connection' },
      { node: 'MetricsEmitter.emit()', file: 'src/server/emitter.ts', line: 44, role: 'crash', desc: 'Exceeded max listener threshold and leaked 120MB heap' }
    ]
  },
  {
    id: 'INC-8924',
    service: 'auth-token-validator',
    errorType: 'JsonWebTokenError: jwt malformed on clock skew',
    message: 'NTP clock drift triggered false-positive token expiration during token rotation',
    timestamp: '28 mins ago',
    status: 'HEALED',
    mttr: '1m 34s',
    locksPassed: 3,
    sandboxId: 'daytona-ws-119c-b88',
    causalTrace: [
      { node: 'TokenVerifier.verify()', file: 'src/auth/jwt.ts', line: 33, role: 'origin', desc: 'Zero clock tolerance allowed ±200ms skew to reject valid JWTs' },
      { node: 'AuthGuard.canActivate()', file: 'src/guards/auth.ts', line: 19, role: 'crash', desc: 'Threw 401 Unauthorized for valid active sessions' }
    ]
  }
];

export const INSTALL_TABS = [
  {
    id: 'curl' as const,
    label: 'Linux / macOS (cURL)',
    osBadge: 'Bash',
    command: 'curl -fsSL https://raw.githubusercontent.com/priyanshupk2022-arch/zeroshield/main/install.sh | bash',
    description: 'Installs DebugForge CLI binary globally and configures shell completions.'
  },
  {
    id: 'powershell' as const,
    label: 'Windows (PowerShell)',
    osBadge: 'PowerShell',
    command: 'irm https://raw.githubusercontent.com/priyanshupk2022-arch/zeroshield/main/install.ps1 | iex',
    description: 'Installs DebugForge on Windows via PowerShell and registers environment PATH.'
  },
  {
    id: 'npm' as const,
    label: 'Global NPM',
    osBadge: 'npm',
    command: 'npm install -g debugforge',
    description: 'Installs debugforge command globally via Node Package Manager.'
  },
  {
    id: 'npx' as const,
    label: 'One-Shot NPX',
    osBadge: 'npx',
    command: 'npx debugforge diagnose --test "npm test"',
    description: 'Runs single-shot autonomous diagnostic without prior global installation.'
  }
];
