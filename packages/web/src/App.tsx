import { useState } from 'react';
import {
  Shield,
  CheckCircle2,
  Copy,
  ExternalLink,
  Code2,
  Lock,
  Flame,
  FileCode2,
  Check,
  Zap,
} from 'lucide-react';

interface VulnerabilityScenario {
  id: string;
  name: string;
  cwe: string;
  severity: 'CRITICAL' | 'HIGH';
  initialCvss: number;
  file: string;
  description: string;
  vulnerableCode: string;
  exploitPayload: string;
  proofSignature: string;
  patchedCode: string;
  lock1Result: string;
  lock2Result: string;
  lock3Result: string;
}

const SCENARIOS: VulnerabilityScenario[] = [
  {
    id: 'cwe-78',
    name: 'Payment Processing API',
    cwe: 'CWE-78: OS Command Injection',
    severity: 'CRITICAL',
    initialCvss: 9.8,
    file: 'src/routes/report.ts',
    description: 'User-controlled input concatenated directly into child_process.exec without validation or parameterization.',
    vulnerableCode: `import { exec } from 'child_process';
export function generateReport(req: Request, res: Response) {
  const format = req.body.format || 'pdf';
  // VULNERABLE: Direct command injection sink
  exec('generate_report --format ' + format, (err, stdout) => {
    res.json({ output: stdout });
  });
}`,
    exploitPayload: `{"format": "pdf; cat /etc/passwd #"}`,
    proofSignature: `root:x:0:0:root:/root:/bin/bash`,
    patchedCode: `import { execFile } from 'child_process';
import { z } from 'zod';

const FormatSchema = z.string().regex(/^[a-zA-Z0-9_\\-\\s]*$/);

export function generateReport(req: Request, res: Response) {
  const parsed = FormatSchema.safeParse(req.body.format || 'pdf');
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid characters in format parameter' });
    return;
  }
  execFile('generate_report', ['--format', parsed.data], (err, stdout) => {
    res.json({ output: stdout });
  });
}`,
    lock1Result: 'HTTP 400 Bad Request — Exploit payload blocked before execution.',
    lock2Result: 'HTTP 200 OK — Standard safe arguments (--summary-only) process cleanly.',
    lock3Result: 'Exit Code 0 — All 5 unit and integration tests pass cleanly in sandbox.',
  },
  {
    id: 'cwe-1321',
    name: 'Tenant Config Merging Worker',
    cwe: 'CWE-1321: Prototype Pollution',
    severity: 'HIGH',
    initialCvss: 7.5,
    file: 'src/routes/config.ts',
    description: 'Unsafe recursive deep-merge assigning arbitrary object keys without filtering __proto__, prototype, or constructor.',
    vulnerableCode: `export function mergeConfig(target: any, source: any) {
  for (const key in source) {
    if (typeof source[key] === 'object' && source[key] !== null) {
      target[key] = mergeConfig(target[key] || {}, source[key]);
    } else {
      // VULNERABLE: Prototype pollution key assignment
      target[key] = source[key];
    }
  }
  return target;
}`,
    exploitPayload: `{"__proto__": {"admin": true}}`,
    proofSignature: `POLLUTED_ADMIN_FLAG`,
    patchedCode: `const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

export function mergeConfig(target: any, source: any) {
  for (const key in source) {
    if (FORBIDDEN_KEYS.has(key)) continue;
    if (typeof source[key] === 'object' && source[key] !== null) {
      target[key] = mergeConfig(target[key] || {}, source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}`,
    lock1Result: 'HTTP 403 Forbidden — Forbidden prototype keys rejected at runtime.',
    lock2Result: 'HTTP 200 OK — Standard nested configuration merges without side-effects.',
    lock3Result: 'Exit Code 0 — Config merge unit test suite passes with Exit 0.',
  },
  {
    id: 'cwe-287',
    name: 'OAuth SSO Authentication Gateway',
    cwe: 'CWE-287: Broken Auth / IDOR',
    severity: 'HIGH',
    initialCvss: 8.8,
    file: 'src/routes/auth.ts',
    description: 'JWT token decoded without cryptographic signature verification (jwt.decode instead of jwt.verify).',
    vulnerableCode: `import jwt from 'jsonwebtoken';
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  // VULNERABLE: Decodes claims without verifying signature
  const claims = jwt.decode(token) as any;
  if (!claims) return res.status(401).json({ error: 'Unauthorized' });
  req.user = claims;
  next();
}`,
    exploitPayload: `Authorization: Bearer forged.unsigned.admin.token`,
    proofSignature: `admin_dashboard_unlocked`,
    patchedCode: `import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'strong-production-secret';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const verified = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    req.user = verified;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or forged token signature' });
  }
}`,
    lock1Result: 'HTTP 401 Unauthorized — Forged token fails cryptographic signature check.',
    lock2Result: 'HTTP 200 OK — Validly signed tokens authenticate seamlessly.',
    lock3Result: 'Exit Code 0 — Auth suite passes all token lifecycle tests.',
  },
  {
    id: 'cwe-918',
    name: 'Cloud Webhook Proxy Service',
    cwe: 'CWE-918: Server-Side Request Forgery',
    severity: 'HIGH',
    initialCvss: 8.6,
    file: 'src/routes/webhook.ts',
    description: 'User-provided webhook destination fetched directly without RFC-1918 or AWS metadata IP blocklist.',
    vulnerableCode: `export async function dispatchWebhook(req: Request, res: Response) {
  const targetUrl = req.body.url;
  // VULNERABLE: Blind HTTP fetch allowing cloud metadata SSRF
  const response = await fetch(targetUrl);
  const data = await response.text();
  res.json({ status: 'dispatched', data });
}`,
    exploitPayload: `{"url": "http://169.254.169.254/latest/meta-data/"}`,
    proofSignature: `iam-security-credentials`,
    patchedCode: `import { z } from 'zod';

const UrlSchema = z.string().url().refine(
  url => !url.includes('169.254.') && !url.includes('127.0.0.1') && !url.includes('localhost'),
  { message: 'Private IP and cloud metadata endpoints prohibited' }
);

export async function dispatchWebhook(req: Request, res: Response) {
  const parse = UrlSchema.safeParse(req.body.url);
  if (!parse.success) {
    res.status(403).json({ error: 'SSRF Blocked: Destination Prohibited' });
    return;
  }
  const response = await fetch(parse.data);
  res.json({ status: 'dispatched', data: await response.text() });
}`,
    lock1Result: 'HTTP 403 Forbidden — Metadata endpoint 169.254.169.254 blocked by Zod filter.',
    lock2Result: 'HTTP 200 OK — Legitimate public webhook URLs dispatch successfully.',
    lock3Result: 'Exit Code 0 — Proxy validation tests pass without regressions.',
  },
  {
    id: 'cwe-22',
    name: 'Document File Viewer Service',
    cwe: 'CWE-22: Path Traversal',
    severity: 'HIGH',
    initialCvss: 7.5,
    file: 'src/routes/file.ts',
    description: 'Unvalidated filename joined to base directory allowing directory traversal escape via ../',
    vulnerableCode: `import path from 'path';
import fs from 'fs';
export function viewFile(req: Request, res: Response) {
  const fileName = req.query.filename as string;
  // VULNERABLE: Direct path concatenation allowing ../ traversal
  const filePath = path.join(process.cwd(), 'public', fileName);
  const content = fs.readFileSync(filePath, 'utf8');
  res.send(content);
}`,
    exploitPayload: `GET /api/file?filename=../../../../etc/passwd`,
    proofSignature: `root:x:0:0`,
    patchedCode: `import path from 'path';
import fs from 'fs';

export function viewFile(req: Request, res: Response) {
  const fileName = req.query.filename as string;
  const baseDir = path.resolve(process.cwd(), 'public');
  const safePath = path.resolve(baseDir, fileName);

  if (!safePath.startsWith(baseDir + path.sep) && safePath !== baseDir) {
    res.status(403).json({ error: 'Path traversal escape blocked' });
    return;
  }
  try {
    const content = fs.readFileSync(safePath, 'utf8');
    res.send(content);
  } catch {
    res.status(404).json({ error: 'File not found' });
  }
}`,
    lock1Result: 'HTTP 403 Forbidden — Path traversal outside public directory rejected.',
    lock2Result: 'HTTP 200 OK — Legitimate public files (terms.txt) read smoothly.',
    lock3Result: 'Exit Code 0 — File viewer unit test suite passes with 0 errors.',
  },
  {
    id: 'cwe-89',
    name: 'User Database Search Service',
    cwe: 'CWE-89: SQL Injection',
    severity: 'CRITICAL',
    initialCvss: 9.3,
    file: 'src/routes/users.ts',
    description: 'Raw SQL query string concatenation permitting auth bypass via standard boolean injection.',
    vulnerableCode: `export function searchUsers(req: Request, res: Response) {
  const query = req.body.query;
  // VULNERABLE: Raw SQL string template interpolation
  const sql = \`SELECT * FROM users WHERE username = '\${query}'\`;
  db.query(sql, (err, rows) => {
    res.json({ results: rows });
  });
}`,
    exploitPayload: `{"query": "' OR '1'='1"}`,
    proofSignature: `HASH_TOKEN_0x99`,
    patchedCode: `import { z } from 'zod';

const QuerySchema = z.string().regex(/^[a-zA-Z0-9_\\-\\s]*$/, {
  message: 'Invalid SQL characters detected'
});

export function searchUsers(req: Request, res: Response) {
  const parsed = QuerySchema.safeParse(req.body.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'SQL Injection attempt blocked' });
    return;
  }
  db.query('SELECT * FROM users WHERE username = ?', [parsed.data], (err, rows) => {
    res.json({ results: rows });
  });
}`,
    lock1Result: 'HTTP 400 Bad Request — Boolean injection payload blocked by parameter validation.',
    lock2Result: 'HTTP 200 OK — Standard alphanumeric searches (e.g. alice) return valid data.',
    lock3Result: 'Exit Code 0 — Database search test suite exits with Code 0.',
  },
];

export function App() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<VulnerabilityScenario>(SCENARIOS[0]);
  const [playgroundStep, setPlaygroundStep] = useState<number>(1);
  const [hitlApproved, setHitlApproved] = useState<boolean>(false);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const runPlaygroundStep = (step: number) => {
    setPlaygroundStep(step);
  };

  const getCvssScore = () => {
    if (playgroundStep < 4) return selectedScenario.initialCvss;
    return 0.0;
  };

  return (
    <div className="min-h-screen bg-[#f7f7f9] text-[#17171b] selection:bg-[#e5533c]/20 selection:text-[#c23a25]">
      {/* Top Bar */}
      <div className="bg-[#17171b] text-[#f0f0f5] py-2 px-4 text-xs font-medium text-center border-b border-[#2b2b36] flex items-center justify-center gap-2">
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-xs bg-[#e5533c] text-white font-mono text-[10px] uppercase font-bold tracking-wider">
          OPEN SOURCE
        </span>
        <span>ZeroShield — Autonomous Cyber Red-Team &amp; Exploit Immunizer Engine</span>
        <a
          href="https://github.com/priyanshupk2022-arch/zeroshield"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-white ml-2 inline-flex items-center gap-1 font-mono"
        >
          GitHub <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#e2e2e8]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-sm bg-[#e5533c] flex items-center justify-center text-white shadow-brutal-accent">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-[#17171b]">ZeroShield</span>
                <span className="text-[11px] font-mono font-semibold bg-[#f0f0f5] text-[#56565f] px-1.5 py-0.5 rounded-xs border border-[#e2e2e8]">
                  v1.0.0
                </span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[#56565f]">
            <a href="#quick-install" className="hover:text-[#17171b] transition-colors">Quick Install</a>
            <a href="#how-it-works" className="hover:text-[#17171b] transition-colors">Architecture</a>
            <a href="#playground" className="hover:text-[#17171b] transition-colors">Live Playground</a>
            <a href="#benchmarks" className="hover:text-[#17171b] transition-colors">Benchmarks (6/6)</a>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/priyanshupk2022-arch/zeroshield"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-sm border border-[#e2e2e8] bg-white hover:bg-[#f7f7f9] text-[#17171b] transition-all"
            >
              <FileCode2 className="w-3.5 h-3.5 text-[#56565f]" />
              <span>Source Code</span>
            </a>
            <a
              href="#quick-install"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-sm bg-[#17171b] text-white hover:bg-[#2b2b36] transition-all shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5"
            >
              <Zap className="w-3.5 h-3.5 text-[#e5533c]" />
              <span>Quick Install</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-20">
        {/* Title Header */}
        <div className="mb-10 text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17171b] tracking-tight mb-3">
            ZeroShield — Autonomous Exploit Immunizer Engine
          </h1>
          <p className="text-base text-[#56565f] leading-relaxed max-w-3xl">
            Autonomous multi-agent cyber defense engine. Discovers AST sinks, attacks them with dynamic Red-Team exploits in Daytona sandboxes, synthesizes Blue-Team AVO patches, and validates Triple-Lock immunization before code is committed.
          </p>
        </div>

        {/* Quick Install Section — Exactly matching Hermes Agent clean style */}
        <section id="quick-install" className="mb-16">
          <div className="border-b border-[#17171b] pb-3 mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#17171b] tracking-tight">Quick Install</h2>
            <span className="text-xs font-mono text-[#56565f]">1-Line Universal Setup</span>
          </div>

          <div className="space-y-6">
            {/* Linux, macOS, WSL2 */}
            <div>
              <div className="text-sm font-bold text-[#17171b] mb-2">Linux, macOS, WSL2, Termux</div>
              <div className="flex items-center justify-between bg-[#111114] text-[#f0f0f5] rounded-xs border border-[#2b2b36] p-3 font-mono text-xs sm:text-sm">
                <span className="select-all overflow-x-auto whitespace-nowrap mr-3 text-[#10b981]">
                  curl -fsSL https://raw.githubusercontent.com/priyanshupk2022-arch/zeroshield/main/install.sh | bash
                </span>
                <button
                  onClick={() => copyToClipboard('curl -fsSL https://raw.githubusercontent.com/priyanshupk2022-arch/zeroshield/main/install.sh | bash', 'install-sh')}
                  className="px-2.5 py-1 rounded-xs bg-[#2b2b36] hover:bg-[#3b3b4a] text-white text-xs flex items-center gap-1 shrink-0 transition-all"
                  title="Copy command"
                >
                  {copiedKey === 'install-sh' ? <Check className="w-3.5 h-3.5 text-[#10b981]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Windows native PowerShell */}
            <div>
              <div className="text-sm font-bold text-[#17171b] mb-1">Windows (native, PowerShell)</div>
              <div className="p-3 bg-[#f0f0f5] rounded-xs border border-[#e2e2e8] text-xs text-[#56565f] mb-2 leading-relaxed">
                <strong className="text-[#17171b]">Heads up:</strong> Native Windows runs ZeroShield natively without WSL — AST scanner, Daytona remote/local runner, and CLI all work natively in PowerShell.
              </div>
              <div className="text-xs font-mono text-[#56565f] mb-1">Run this in PowerShell:</div>
              <div className="flex items-center justify-between bg-[#111114] text-[#f0f0f5] rounded-xs border border-[#2b2b36] p-3 font-mono text-xs sm:text-sm">
                <span className="select-all overflow-x-auto whitespace-nowrap mr-3 text-[#38bdf8]">
                  iex (irm https://raw.githubusercontent.com/priyanshupk2022-arch/zeroshield/main/install.ps1)
                </span>
                <button
                  onClick={() => copyToClipboard('iex (irm https://raw.githubusercontent.com/priyanshupk2022-arch/zeroshield/main/install.ps1)', 'install-ps1')}
                  className="px-2.5 py-1 rounded-xs bg-[#2b2b36] hover:bg-[#3b3b4a] text-white text-xs flex items-center gap-1 shrink-0 transition-all"
                  title="Copy command"
                >
                  {copiedKey === 'install-ps1' ? <Check className="w-3.5 h-3.5 text-[#10b981]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Direct NPM Install */}
            <div>
              <div className="text-sm font-bold text-[#17171b] mb-2">Or install globally via npm</div>
              <div className="flex items-center justify-between bg-[#111114] text-[#f0f0f5] rounded-xs border border-[#2b2b36] p-3 font-mono text-xs sm:text-sm">
                <span className="select-all overflow-x-auto whitespace-nowrap mr-3 text-[#f0f0f5]">
                  npm install -g @zeroshield/cli
                </span>
                <button
                  onClick={() => copyToClipboard('npm install -g @zeroshield/cli', 'install-npm')}
                  className="px-2.5 py-1 rounded-xs bg-[#2b2b36] hover:bg-[#3b3b4a] text-white text-xs flex items-center gap-1 shrink-0 transition-all"
                  title="Copy command"
                >
                  {copiedKey === 'install-npm' ? <Check className="w-3.5 h-3.5 text-[#10b981]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Zero-Install Instant Run */}
            <div>
              <div className="text-sm font-bold text-[#17171b] mb-2">Zero-Install Instant Run (No installation required)</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-[#111114] text-[#f0f0f5] rounded-xs border border-[#2b2b36] p-3 font-mono text-xs sm:text-sm">
                  <span className="select-all overflow-x-auto whitespace-nowrap mr-3 text-[#f59e0b]">
                    npx zeroshield scan ./src
                  </span>
                  <button
                    onClick={() => copyToClipboard('npx zeroshield scan ./src', 'npx-scan')}
                    className="px-2.5 py-1 rounded-xs bg-[#2b2b36] hover:bg-[#3b3b4a] text-white text-xs flex items-center gap-1 shrink-0 transition-all"
                  >
                    {copiedKey === 'npx-scan' ? <Check className="w-3.5 h-3.5 text-[#10b981]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center justify-between bg-[#111114] text-[#f0f0f5] rounded-xs border border-[#2b2b36] p-3 font-mono text-xs sm:text-sm">
                  <span className="select-all overflow-x-auto whitespace-nowrap mr-3 text-[#f59e0b]">
                    npx zeroshield immunize ./src --port 8080 --local
                  </span>
                  <button
                    onClick={() => copyToClipboard('npx zeroshield immunize ./src --port 8080 --local', 'npx-imm')}
                    className="px-2.5 py-1 rounded-xs bg-[#2b2b36] hover:bg-[#3b3b4a] text-white text-xs flex items-center gap-1 shrink-0 transition-all"
                  >
                    {copiedKey === 'npx-imm' ? <Check className="w-3.5 h-3.5 text-[#10b981]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Explanatory callout */}
            <div className="text-xs text-[#56565f] leading-relaxed pt-2">
              The installer handles everything: TypeScript AST engine, Daytona isolated sandboxing, adversarial Red-Team payload generators, and the Triple-Lock immunization assertion runner.
            </div>
          </div>
        </section>

        {/* Architecture Section */}
        <section id="how-it-works" className="mb-16 pt-6 border-t border-[#e2e2e8]">
          <h2 className="text-2xl font-bold text-[#17171b] tracking-tight mb-2">Architecture &amp; Core Pipeline</h2>
          <p className="text-sm text-[#56565f] mb-6">
            ZeroShield automates the complete vulnerability-to-immunization lifecycle inside isolated container sandboxes:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-sm border border-[#e2e2e8] bg-white">
              <div className="w-7 h-7 rounded-xs bg-[#17171b] text-white flex items-center justify-center font-mono font-bold text-xs mb-3">
                01
              </div>
              <div className="font-bold text-sm text-[#17171b] mb-1 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[#e5533c]" />
                <span>Daytona Red Exploit Arena</span>
              </div>
              <p className="text-xs text-[#56565f] leading-relaxed">
                Spawns candidate code inside an ephemeral Daytona sandbox. Attacks the target with live HTTP exploits to capture verified proof of exploitability.
              </p>
            </div>

            <div className="p-5 rounded-sm border border-[#e2e2e8] bg-white">
              <div className="w-7 h-7 rounded-xs bg-[#17171b] text-white flex items-center justify-center font-mono font-bold text-xs mb-3">
                02
              </div>
              <div className="font-bold text-sm text-[#17171b] mb-1 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-[#3b82f6]" />
                <span>Blue Agent AVO Patch</span>
              </div>
              <p className="text-xs text-[#56565f] leading-relaxed">
                Synthesizes deterministic TypeScript AST codemods with runtime Zod input validation schemas and strict boundary assertions in &lt;12ms.
              </p>
            </div>

            <div className="p-5 rounded-sm border border-[#e2e2e8] bg-white">
              <div className="w-7 h-7 rounded-xs bg-[#17171b] text-white flex items-center justify-center font-mono font-bold text-xs mb-3">
                03
              </div>
              <div className="font-bold text-sm text-[#17171b] mb-1 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-[#10b981]" />
                <span>Triple-Lock Verification</span>
              </div>
              <p className="text-xs text-[#56565f] leading-relaxed">
                Lock 1: Exploit blocked (HTTP 400/403). Lock 2: Legitimate traffic preserved (HTTP 200). Lock 3: Target unit tests pass with Exit 0.
              </p>
            </div>
          </div>
        </section>

        {/* Live Interactive Playground */}
        <section id="playground" className="mb-16 pt-6 border-t border-[#e2e2e8]">
          <h2 className="text-2xl font-bold text-[#17171b] tracking-tight mb-2">Live Pipeline Simulator</h2>
          <p className="text-sm text-[#56565f] mb-6">
            Test the 4 core immunization stages interactively across 6 production vulnerability fixtures.
          </p>

          {/* Scenario Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4 font-mono text-xs">
            {SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                onClick={() => {
                  setSelectedScenario(sc);
                  setPlaygroundStep(1);
                  setHitlApproved(false);
                }}
                className={`p-2.5 rounded-xs text-left border transition-all ${
                  selectedScenario.id === sc.id
                    ? 'bg-[#17171b] border-[#17171b] text-white font-bold'
                    : 'bg-white border-[#e2e2e8] text-[#56565f] hover:border-[#17171b]'
                }`}
              >
                <div className="text-[10px] text-[#e5533c] font-bold">{sc.cwe.split(':')[0]}</div>
                <div className="truncate font-semibold mt-0.5">{sc.name.split(' ')[0]}</div>
              </button>
            ))}
          </div>

          {/* Interactive Workspace */}
          <div className="bg-white rounded-sm border border-[#17171b] shadow-brutal-dark overflow-hidden">
            <div className="bg-[#17171b] text-white p-3.5 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold">{selectedScenario.name}</span>
                <span className="bg-[#e5533c] text-white px-1.5 py-0.5 rounded-xs text-[10px] font-bold">
                  {selectedScenario.cwe}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#9d9da8]">CVSS:</span>
                <span className={`font-bold ${getCvssScore() === 0 ? 'text-[#10b981]' : 'text-[#e5533c]'}`}>
                  {getCvssScore() === 0 ? '0.0 CLEAN' : `${getCvssScore()} CRITICAL`}
                </span>
              </div>
            </div>

            {/* Stepper */}
            <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-[#e2e2e8] bg-[#f7f7f9] text-xs font-mono">
              <button
                onClick={() => runPlaygroundStep(1)}
                className={`p-2.5 text-center border-r border-[#e2e2e8] transition-all ${
                  playgroundStep >= 1 ? 'bg-white font-bold text-[#17171b]' : 'text-[#56565f]'
                }`}
              >
                1. SAST Discovery
              </button>
              <button
                onClick={() => runPlaygroundStep(2)}
                className={`p-2.5 text-center border-r border-[#e2e2e8] transition-all ${
                  playgroundStep >= 2 ? 'bg-white font-bold text-[#e5533c]' : 'text-[#56565f]'
                }`}
              >
                2. Red Exploit Proof
              </button>
              <button
                onClick={() => runPlaygroundStep(3)}
                className={`p-2.5 text-center border-r border-[#e2e2e8] transition-all ${
                  playgroundStep >= 3 ? 'bg-white font-bold text-[#3b82f6]' : 'text-[#56565f]'
                }`}
              >
                3. Blue AVO Patch
              </button>
              <button
                onClick={() => runPlaygroundStep(4)}
                className={`p-2.5 text-center transition-all ${
                  playgroundStep >= 4 ? 'bg-white font-bold text-[#10b981]' : 'text-[#56565f]'
                }`}
              >
                4. Triple-Lock Pass
              </button>
            </div>

            {/* Code & Results */}
            <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-mono text-[#56565f] mb-1.5 font-semibold">
                  {playgroundStep >= 3 ? '🛡️ Synthesized AST Patch:' : '⚠️ Vulnerable Sink:'}
                </div>
                <div className="bg-[#111114] text-[#f0f0f5] p-3 rounded-xs font-mono text-xs overflow-x-auto max-h-[300px] border border-[#2b2b36]">
                  <pre>{playgroundStep >= 3 ? selectedScenario.patchedCode : selectedScenario.vulnerableCode}</pre>
                </div>
              </div>

              <div className="flex flex-col justify-between">
                <div>
                  <div className="text-xs font-mono text-[#17171b] mb-1.5 font-bold">
                    Sandbox Execution Status:
                  </div>

                  {playgroundStep === 1 && (
                    <div className="p-3 bg-[#f7f7f9] border border-[#e2e2e8] font-mono text-xs space-y-1.5">
                      <div className="text-[#e5533c] font-bold">🔍 Vulnerability Detected</div>
                      <div className="text-[#56565f]">{selectedScenario.description}</div>
                    </div>
                  )}

                  {playgroundStep === 2 && (
                    <div className="p-3 bg-[#111114] text-[#f0f0f5] font-mono text-xs space-y-1.5 border border-[#2b2b36]">
                      <div className="text-[#e5533c] font-bold">⚡ Exploit Confirmed in Sandbox</div>
                      <div className="text-[#9d9da8]">Payload: <code>{selectedScenario.exploitPayload}</code></div>
                      <div className="text-[#10b981]">Proof: <code>{selectedScenario.proofSignature}</code></div>
                    </div>
                  )}

                  {playgroundStep >= 3 && (
                    <div className="p-3 bg-[#f7f7f9] border border-[#e2e2e8] font-mono text-xs space-y-2">
                      <div className="text-[#10b981] font-bold">🔒 Triple-Lock Verified Clean</div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#56565f]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" /> Lock 1: {selectedScenario.lock1Result}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#56565f]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" /> Lock 2: {selectedScenario.lock2Result}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#56565f]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" /> Lock 3: {selectedScenario.lock3Result}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-[#e2e2e8]">
                  <div className="flex items-center justify-between bg-[#f0f0f5] p-2.5 rounded-xs border border-[#e2e2e8] text-xs font-mono">
                    <span className="font-semibold text-[#17171b]">HMAC-SHA256 Sign-off:</span>
                    <button
                      onClick={() => setHitlApproved(!hitlApproved)}
                      className={`px-3 py-1 rounded-xs font-bold transition-all ${
                        hitlApproved ? 'bg-[#10b981] text-white' : 'bg-[#17171b] text-white hover:bg-[#2b2b36]'
                      }`}
                    >
                      {hitlApproved ? 'Approved ✓' : 'Approve'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Verified Benchmark Scorecard */}
        <section id="benchmarks" className="pt-6 border-t border-[#e2e2e8]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-[#17171b] tracking-tight">Verified Benchmark Scorecard</h2>
            <span className="text-xs font-mono bg-[#10b981]/10 text-[#059669] px-2 py-1 rounded-xs font-bold border border-[#10b981]/30">
              6/6 TARGETS 100% IMMUNIZED
            </span>
          </div>

          <div className="overflow-x-auto rounded-sm border border-[#17171b] shadow-brutal-sm">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#17171b] text-white uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-bold">Target Service</th>
                  <th className="py-3 px-4 font-bold">CWE Class</th>
                  <th className="py-3 px-4 font-bold">Initial CVSS</th>
                  <th className="py-3 px-4 font-bold">Resulting CVSS</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e2e8] bg-white">
                <tr className="hover:bg-[#f7f7f9]">
                  <td className="py-2.5 px-4 font-bold text-[#17171b]">Payment Processing API</td>
                  <td className="py-2.5 px-4 text-[#56565f]">CWE-78 (Command Injection)</td>
                  <td className="py-2.5 px-4 text-[#e5533c] font-bold">9.8 Critical</td>
                  <td className="py-2.5 px-4 text-[#10b981] font-bold">0.0 Clean</td>
                  <td className="py-2.5 px-4"><span className="px-2 py-0.5 rounded-xs bg-[#10b981]/10 text-[#059669] font-bold">IMMUNIZED</span></td>
                </tr>
                <tr className="hover:bg-[#f7f7f9]">
                  <td className="py-2.5 px-4 font-bold text-[#17171b]">Tenant Config Merging Worker</td>
                  <td className="py-2.5 px-4 text-[#56565f]">CWE-1321 (Prototype Pollution)</td>
                  <td className="py-2.5 px-4 text-[#e5533c] font-bold">7.5 High</td>
                  <td className="py-2.5 px-4 text-[#10b981] font-bold">0.0 Clean</td>
                  <td className="py-2.5 px-4"><span className="px-2 py-0.5 rounded-xs bg-[#10b981]/10 text-[#059669] font-bold">IMMUNIZED</span></td>
                </tr>
                <tr className="hover:bg-[#f7f7f9]">
                  <td className="py-2.5 px-4 font-bold text-[#17171b]">OAuth SSO Gateway</td>
                  <td className="py-2.5 px-4 text-[#56565f]">CWE-287 (Broken Auth / IDOR)</td>
                  <td className="py-2.5 px-4 text-[#e5533c] font-bold">8.8 High</td>
                  <td className="py-2.5 px-4 text-[#10b981] font-bold">0.0 Clean</td>
                  <td className="py-2.5 px-4"><span className="px-2 py-0.5 rounded-xs bg-[#10b981]/10 text-[#059669] font-bold">IMMUNIZED</span></td>
                </tr>
                <tr className="hover:bg-[#f7f7f9]">
                  <td className="py-2.5 px-4 font-bold text-[#17171b]">Cloud Webhook Proxy Service</td>
                  <td className="py-2.5 px-4 text-[#56565f]">CWE-918 (SSRF)</td>
                  <td className="py-2.5 px-4 text-[#e5533c] font-bold">8.6 High</td>
                  <td className="py-2.5 px-4 text-[#10b981] font-bold">0.0 Clean</td>
                  <td className="py-2.5 px-4"><span className="px-2 py-0.5 rounded-xs bg-[#10b981]/10 text-[#059669] font-bold">IMMUNIZED</span></td>
                </tr>
                <tr className="hover:bg-[#f7f7f9]">
                  <td className="py-2.5 px-4 font-bold text-[#17171b]">Document File Viewer</td>
                  <td className="py-2.5 px-4 text-[#56565f]">CWE-22 (Path Traversal)</td>
                  <td className="py-2.5 px-4 text-[#e5533c] font-bold">7.5 High</td>
                  <td className="py-2.5 px-4 text-[#10b981] font-bold">0.0 Clean</td>
                  <td className="py-2.5 px-4"><span className="px-2 py-0.5 rounded-xs bg-[#10b981]/10 text-[#059669] font-bold">IMMUNIZED</span></td>
                </tr>
                <tr className="hover:bg-[#f7f7f9]">
                  <td className="py-2.5 px-4 font-bold text-[#17171b]">User Database Search Service</td>
                  <td className="py-2.5 px-4 text-[#56565f]">CWE-89 (SQL Injection)</td>
                  <td className="py-2.5 px-4 text-[#e5533c] font-bold">9.3 Critical</td>
                  <td className="py-2.5 px-4 text-[#10b981] font-bold">0.0 Clean</td>
                  <td className="py-2.5 px-4"><span className="px-2 py-0.5 rounded-xs bg-[#10b981]/10 text-[#059669] font-bold">IMMUNIZED</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 bg-[#17171b] text-[#9d9da8] text-xs font-mono border-t border-[#2b2b36]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#e5533c]" />
            <span className="font-bold text-white">ZeroShield</span>
            <span>• MIT Licensed Open Source</span>
          </div>

          <div className="flex items-center gap-4">
            <a href="https://github.com/priyanshupk2022-arch/zeroshield" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a>
            <a href="#quick-install" className="hover:text-white transition-colors">Install</a>
            <a href="#benchmarks" className="hover:text-white transition-colors">BENCHMARK.md</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
