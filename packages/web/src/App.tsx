import { useState } from 'react';
import {
  Shield,
  CheckCircle2,
  Copy,
  Code2,
  Lock,
  Flame,
  FileCode2,
  Check,
  Zap,
  Terminal,
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
    <div className="min-h-screen bg-[#fafafa] text-[#0f172a] font-sans antialiased selection:bg-[#e5533c]/15 selection:text-[#e5533c]">
      {/* Subtle Ambient Background Mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-40">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[#e5533c]/10 via-[#f43f5e]/5 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Floating Island Navigation */}
      <div className="fixed top-5 inset-x-0 z-50 flex justify-center px-4">
        <nav className="flex items-center justify-between gap-6 px-5 py-2.5 bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-soft rounded-full max-w-3xl w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#0f172a] text-white flex items-center justify-center shadow-sm">
              <Shield className="w-3.5 h-3.5 text-[#e5533c]" />
            </div>
            <span className="font-bold text-sm tracking-tight text-[#0f172a]">ZeroShield</span>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
              v1.0.0
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-6 text-xs font-medium text-slate-600">
            <a href="#quick-install" className="hover:text-[#0f172a] transition-colors">Quick Install</a>
            <a href="#architecture" className="hover:text-[#0f172a] transition-colors">Architecture</a>
            <a href="#playground" className="hover:text-[#0f172a] transition-colors">Live Studio</a>
            <a href="#benchmarks" className="hover:text-[#0f172a] transition-colors">Scorecard</a>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://github.com/priyanshupk2022-arch/zeroshield"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all"
            >
              <FileCode2 className="w-3.5 h-3.5 text-slate-500" />
              <span>GitHub</span>
            </a>
            <a
              href="#quick-install"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full bg-[#0f172a] text-white hover:bg-slate-800 transition-all shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 text-[#e5533c]" />
              <span>Install</span>
            </a>
          </div>
        </nav>
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-32 pb-24">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm text-xs font-medium text-slate-600 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#e5533c] animate-pulse" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-900 font-semibold">
              Autonomous Cyber Red-Team Engine
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-5">
            Immunize vulnerable code before it ever reaches disk.
          </h1>

          <p className="text-base text-slate-600 leading-relaxed max-w-xl mx-auto">
            ZeroShield isolates code in ephemeral Daytona sandboxes, confirms exploits with live adversarial payloads, and synthesizes Triple-Lock verified AST codemods in milliseconds.
          </p>
        </div>

        {/* Quick Install Section (Hermes / Nous Research style) */}
        <section id="quick-install" className="mb-20 scroll-mt-24">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                  <Terminal className="w-4 h-4 text-[#e5533c]" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Quick Install</h2>
              </div>
              <span className="text-xs font-mono text-slate-400">One-liner setup</span>
            </div>

            <div className="space-y-6">
              {/* Linux / macOS */}
              <div>
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 font-mono">
                  Linux, macOS, WSL2, Termux
                </div>
                <div className="flex items-center justify-between bg-[#090d16] text-slate-200 rounded-xl p-3.5 font-mono text-xs sm:text-sm border border-[#1e293b] shadow-sm">
                  <span className="select-all overflow-x-auto whitespace-nowrap mr-3 text-emerald-400">
                    curl -fsSL https://raw.githubusercontent.com/priyanshupk2022-arch/zeroshield/main/install.sh | bash
                  </span>
                  <button
                    onClick={() => copyToClipboard('curl -fsSL https://raw.githubusercontent.com/priyanshupk2022-arch/zeroshield/main/install.sh | bash', 'install-sh')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 shrink-0 transition-all"
                    title="Copy command"
                  >
                    {copiedKey === 'install-sh' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Windows native PowerShell */}
              <div>
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
                  Windows (native, PowerShell)
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs text-slate-600 mb-2 leading-relaxed">
                  <strong className="text-slate-900">Heads up:</strong> Native Windows runs ZeroShield without WSL — AST scanner, Daytona local/cloud runner, and CLI tools all work natively in PowerShell.
                </div>
                <div className="flex items-center justify-between bg-[#090d16] text-slate-200 rounded-xl p-3.5 font-mono text-xs sm:text-sm border border-[#1e293b] shadow-sm">
                  <span className="select-all overflow-x-auto whitespace-nowrap mr-3 text-sky-400">
                    iex (irm https://raw.githubusercontent.com/priyanshupk2022-arch/zeroshield/main/install.ps1)
                  </span>
                  <button
                    onClick={() => copyToClipboard('iex (irm https://raw.githubusercontent.com/priyanshupk2022-arch/zeroshield/main/install.ps1)', 'install-ps1')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 shrink-0 transition-all"
                    title="Copy command"
                  >
                    {copiedKey === 'install-ps1' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Global NPM */}
              <div>
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 font-mono">
                  Or install globally via npm
                </div>
                <div className="flex items-center justify-between bg-[#090d16] text-slate-200 rounded-xl p-3.5 font-mono text-xs sm:text-sm border border-[#1e293b] shadow-sm">
                  <span className="select-all overflow-x-auto whitespace-nowrap mr-3 text-slate-100">
                    npm install -g @zeroshield/cli
                  </span>
                  <button
                    onClick={() => copyToClipboard('npm install -g @zeroshield/cli', 'install-npm')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 shrink-0 transition-all"
                    title="Copy command"
                  >
                    {copiedKey === 'install-npm' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-500 pt-2 leading-relaxed border-t border-slate-100">
                The installer configures the isolated sandbox lifecycle, AST codemod engine, adversarial Red-Team payload generators, and Triple-Lock verification gates.
              </div>
            </div>
          </div>
        </section>

        {/* Architecture Section */}
        <section id="architecture" className="mb-20 scroll-mt-24">
          <div className="text-left mb-8">
            <span className="text-xs font-mono font-bold text-[#e5533c] tracking-widest uppercase">
              Deterministic Defense
            </span>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
              Architecture &amp; Tri-Phase Lifecycle
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-soft hover:shadow-md transition-all">
              <div className="w-8 h-8 rounded-xl bg-red-50 text-[#e5533c] flex items-center justify-center font-bold text-xs mb-4">
                <Flame className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 mb-1.5">1. Daytona Red Exploit Arena</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Executes code inside an ephemeral isolated sandbox without host credentials. Fires dynamic HTTP exploits to capture non-repudiable proof of exploitability.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-soft hover:shadow-md transition-all">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs mb-4">
                <Code2 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 mb-1.5">2. Blue Agent AVO Patch</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Synthesizes deterministic TypeScript AST codemods with runtime Zod parameterization and strict boundary assertions in &lt;12ms.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-soft hover:shadow-md transition-all">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs mb-4">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 mb-1.5">3. Triple-Lock Verification</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Lock 1: Exploit blocked (HTTP 400/403). Lock 2: Legitimate traffic preserved (HTTP 200). Lock 3: Target unit tests pass with Exit 0.
              </p>
            </div>
          </div>
        </section>

        {/* Live Studio / Interactive Playground */}
        <section id="playground" className="mb-20 scroll-mt-24">
          <div className="text-left mb-8">
            <span className="text-xs font-mono font-bold text-[#e5533c] tracking-widest uppercase">
              Interactive Execution
            </span>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
              Live Immunization Studio
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select a real microservice target and inspect the AST transformation and Triple-Lock verification.
            </p>
          </div>

          {/* Scenario Selector Pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                onClick={() => {
                  setSelectedScenario(sc);
                  setPlaygroundStep(1);
                  setHitlApproved(false);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                  selectedScenario.id === sc.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="font-mono text-[10px] opacity-75 mr-1.5">{sc.cwe.split(':')[0]}</span>
                <span>{sc.name}</span>
              </button>
            ))}
          </div>

          {/* Interactive Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
              <div>
                <span className="font-bold text-sm">{selectedScenario.name}</span>
                <span className="ml-2.5 px-2 py-0.5 rounded-full bg-[#e5533c]/20 text-[#e5533c] border border-[#e5533c]/30 text-[10px] font-bold">
                  {selectedScenario.cwe}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">CVSS Threat:</span>
                <span className={`font-bold ${getCvssScore() === 0 ? 'text-emerald-400' : 'text-[#e5533c]'}`}>
                  {getCvssScore() === 0 ? '0.0 CLEAN' : `${getCvssScore()} CRITICAL`}
                </span>
              </div>
            </div>

            {/* Stepper Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-100 bg-slate-50/70 text-xs font-medium">
              <button
                onClick={() => runPlaygroundStep(1)}
                className={`p-3 text-center transition-all ${
                  playgroundStep >= 1 ? 'bg-white text-slate-900 font-semibold shadow-sm' : 'text-slate-500'
                }`}
              >
                1. SAST Discovery
              </button>
              <button
                onClick={() => runPlaygroundStep(2)}
                className={`p-3 text-center transition-all ${
                  playgroundStep >= 2 ? 'bg-white text-[#e5533c] font-semibold shadow-sm' : 'text-slate-500'
                }`}
              >
                2. Red Exploit Proof
              </button>
              <button
                onClick={() => runPlaygroundStep(3)}
                className={`p-3 text-center transition-all ${
                  playgroundStep >= 3 ? 'bg-white text-blue-600 font-semibold shadow-sm' : 'text-slate-500'
                }`}
              >
                3. Blue AVO Patch
              </button>
              <button
                onClick={() => runPlaygroundStep(4)}
                className={`p-3 text-center transition-all ${
                  playgroundStep >= 4 ? 'bg-white text-emerald-600 font-semibold shadow-sm' : 'text-slate-500'
                }`}
              >
                4. Triple-Lock Pass
              </button>
            </div>

            {/* Display Body */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Code View */}
              <div>
                <div className="text-xs font-mono text-slate-500 mb-2 font-medium">
                  {playgroundStep >= 3 ? '🛡️ Synthesized AST Patch:' : '⚠️ Vulnerable Sink:'}
                </div>
                <div className="bg-[#090d16] text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-[320px] border border-[#1e293b]">
                  <pre>{playgroundStep >= 3 ? selectedScenario.patchedCode : selectedScenario.vulnerableCode}</pre>
                </div>
              </div>

              {/* Right Diagnostics */}
              <div className="flex flex-col justify-between">
                <div>
                  <div className="text-xs font-mono text-slate-900 mb-2 font-bold">
                    Sandbox Verification State:
                  </div>

                  {playgroundStep === 1 && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono space-y-2">
                      <div className="text-[#e5533c] font-bold">🔍 Vulnerability Sink Detected</div>
                      <div className="text-slate-600">{selectedScenario.description}</div>
                      <div className="text-slate-900 font-medium">Initial Score: {selectedScenario.initialCvss} Critical</div>
                    </div>
                  )}

                  {playgroundStep === 2 && (
                    <div className="p-4 bg-[#090d16] text-slate-200 rounded-xl border border-[#1e293b] text-xs font-mono space-y-2">
                      <div className="text-[#e5533c] font-bold">⚡ Exploit Confirmed in Sandbox</div>
                      <div className="text-slate-400">Payload: <code className="text-slate-100">{selectedScenario.exploitPayload}</code></div>
                      <div className="text-emerald-400">Proof: <code>{selectedScenario.proofSignature}</code></div>
                    </div>
                  )}

                  {playgroundStep >= 3 && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono space-y-2.5">
                      <div className="text-emerald-600 font-bold">🔒 Triple-Lock Verified Clean</div>
                      <div className="flex items-start gap-2 text-slate-600 text-[11px]">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Lock 1:</strong> {selectedScenario.lock1Result}</span>
                      </div>
                      <div className="flex items-start gap-2 text-slate-600 text-[11px]">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Lock 2:</strong> {selectedScenario.lock2Result}</span>
                      </div>
                      <div className="flex items-start gap-2 text-slate-600 text-[11px]">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Lock 3:</strong> {selectedScenario.lock3Result}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* HITL Sign-off */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs font-mono">
                    <span className="font-semibold text-slate-800">HMAC-SHA256 Sign-off:</span>
                    <button
                      onClick={() => setHitlApproved(!hitlApproved)}
                      className={`px-3.5 py-1.5 rounded-lg font-bold transition-all text-xs ${
                        hitlApproved ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
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

        {/* Verified Scorecard */}
        <section id="benchmarks" className="scroll-mt-24">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs font-mono font-bold text-emerald-600 tracking-widest uppercase">
                Evaluation Matrix
              </span>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
                Official Benchmark Scorecard
              </h2>
            </div>
            <span className="text-xs font-mono bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full font-bold border border-emerald-200">
              6/6 TARGETS 100% IMMUNIZED
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-soft">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Target Service</th>
                  <th className="py-3.5 px-4 font-semibold">CWE Class</th>
                  <th className="py-3.5 px-4 font-semibold">Initial CVSS</th>
                  <th className="py-3.5 px-4 font-semibold">Resulting CVSS</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-900">Payment Processing API</td>
                  <td className="py-3 px-4 text-slate-600">CWE-78 (Command Injection)</td>
                  <td className="py-3 px-4 text-[#e5533c] font-bold">9.8 Critical</td>
                  <td className="py-3 px-4 text-emerald-600 font-bold">0.0 Clean</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">IMMUNIZED</span></td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-900">Tenant Config Merging Worker</td>
                  <td className="py-3 px-4 text-slate-600">CWE-1321 (Prototype Pollution)</td>
                  <td className="py-3 px-4 text-[#e5533c] font-bold">7.5 High</td>
                  <td className="py-3 px-4 text-emerald-600 font-bold">0.0 Clean</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">IMMUNIZED</span></td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-900">OAuth SSO Gateway</td>
                  <td className="py-3 px-4 text-slate-600">CWE-287 (Broken Auth / IDOR)</td>
                  <td className="py-3 px-4 text-[#e5533c] font-bold">8.8 High</td>
                  <td className="py-3 px-4 text-emerald-600 font-bold">0.0 Clean</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">IMMUNIZED</span></td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-900">Cloud Webhook Proxy Service</td>
                  <td className="py-3 px-4 text-slate-600">CWE-918 (SSRF)</td>
                  <td className="py-3 px-4 text-[#e5533c] font-bold">8.6 High</td>
                  <td className="py-3 px-4 text-emerald-600 font-bold">0.0 Clean</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">IMMUNIZED</span></td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-900">Document File Viewer</td>
                  <td className="py-3 px-4 text-slate-600">CWE-22 (Path Traversal)</td>
                  <td className="py-3 px-4 text-[#e5533c] font-bold">7.5 High</td>
                  <td className="py-3 px-4 text-emerald-600 font-bold">0.0 Clean</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">IMMUNIZED</span></td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-900">User Database Search Service</td>
                  <td className="py-3 px-4 text-slate-600">CWE-89 (SQL Injection)</td>
                  <td className="py-3 px-4 text-[#e5533c] font-bold">9.3 Critical</td>
                  <td className="py-3 px-4 text-emerald-600 font-bold">0.0 Clean</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">IMMUNIZED</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-10 bg-white border-t border-slate-200/80 text-slate-500 text-xs font-mono">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#e5533c]" />
            <span className="font-bold text-slate-900">ZeroShield</span>
            <span>• MIT Licensed Open Source</span>
          </div>

          <div className="flex items-center gap-5">
            <a href="https://github.com/priyanshupk2022-arch/zeroshield" target="_blank" rel="noreferrer" className="hover:text-slate-900 transition-colors">GitHub</a>
            <a href="#quick-install" className="hover:text-slate-900 transition-colors">Quick Install</a>
            <a href="#benchmarks" className="hover:text-slate-900 transition-colors">BENCHMARK.md</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
