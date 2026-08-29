import { useState } from "react";
import {
  ShieldCheck,
  Copy,
  Check,
  GitBranch,
  Cpu,
  Lock,
  AlertTriangle,
  FileCode,
  Sparkles,
  Server,
  Activity,
  CheckCircle2
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"null" | "race" | "memory">("null");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const terminalLogs = {
    null: [
      { type: "cmd", text: "$ debugforge diagnose --target fixtures/null-propagation-api" },
      { type: "thought", text: "🧠 [Agent Thought] Ingesting error signals & spinning up isolated Daytona sandbox..." },
      { type: "event", text: "⚡ [Tool Call] daytona_reproduce (fixtures/null-propagation-api)..." },
      { type: "alert", text: "🚨 [Crash Site] tests/orders.test.js:6 [TypeError: Cannot read properties of undefined (reading 'id')]" },
      { type: "thought", text: "🧠 [Agent Thought] Tracing state mutations backwards from crash site to locate infection origin..." },
      { type: "rca", text: "🎯 [Infection Origin Located] src/services/user-service.js:8\n   Root Cause: Connection pool exhaustion returns undefined silently instead of queuing ticket." },
      { type: "patch", text: "🔧 [Patch Synthesized] 2 surgical AST diffs created (user-service.js & order-service.js)" },
      { type: "lock", text: "🔒 [Triple-Lock Verification]\n   ✔ Lock 1 (Bug Fixed): PASSED\n   ✔ Lock 2 (No Regressions): PASSED\n   ✔ Lock 3 (Stress Verified): PASSED (100% test pass in 1661ms)" },
      { type: "success", text: "🎉 [Agent Complete] Microservice auto-healed & verified with zero human intervention." }
    ],
    race: [
      { type: "cmd", text: "$ debugforge diagnose --target fixtures/race-condition-app" },
      { type: "thought", text: "🧠 [Agent Thought] Ingesting concurrent execution logs & reproducing in Daytona sandbox..." },
      { type: "event", text: "⚡ [Tool Call] daytona_reproduce (fixtures/race-condition-app)..." },
      { type: "alert", text: "🚨 [Crash Site] tests/race.test.js:14 [AssertionError: expected 10, got 6]" },
      { type: "thought", text: "🧠 [Agent Thought] Tracing async event loop ticks and identifying unsynchronized read-modify-write..." },
      { type: "rca", text: "🎯 [Infection Origin Located] src/index.js:6\n   Root Cause: Unsynchronized asynchronous state increment drops updates under concurrent requests." },
      { type: "patch", text: "🔧 [Patch Synthesized] Injected async mutex lock queue to serialize critical section." },
      { type: "lock", text: "🔒 [Triple-Lock Verification]\n   ✔ Lock 1 (Bug Fixed): PASSED (10/10 count verified)\n   ✔ Lock 2 (No Regressions): PASSED\n   ✔ Lock 3 (Stress Verified): PASSED" },
      { type: "success", text: "🎉 [Agent Complete] Race condition resolved with deterministic mutex serialization." }
    ],
    memory: [
      { type: "cmd", text: "$ debugforge diagnose --target fixtures/memory-leak-server" },
      { type: "thought", text: "🧠 [Agent Thought] Profiling heap growth curve inside isolated Daytona container..." },
      { type: "event", text: "⚡ [Tool Call] daytona_reproduce (fixtures/memory-leak-server)..." },
      { type: "alert", text: "🚨 [Crash Site] tests/memory.test.js:12 [AssertionError: Cache size 200 exceeded limit of 50]" },
      { type: "thought", text: "🧠 [Agent Thought] Identifying unbounded array growth at module root without LRU eviction policy..." },
      { type: "rca", text: "🎯 [Infection Origin Located] src/index.js:2\n   Root Cause: Global array accumulates request payloads indefinitely without eviction window." },
      { type: "patch", text: "🔧 [Patch Synthesized] Replaced unbounded array with bounded LRU Ring Buffer (capacity: 50)." },
      { type: "lock", text: "🔒 [Triple-Lock Verification]\n   ✔ Lock 1 (Bug Fixed): PASSED (Memory bounded at 50)\n   ✔ Lock 2 (No Regressions): PASSED\n   ✔ Lock 3 (Stress Verified): PASSED" },
      { type: "success", text: "🎉 [Agent Complete] Memory leak eliminated with bounded buffer eviction." }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-cyan-500 selection:text-white">
      {/* Floating Island Navigation */}
      <header className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
        <nav className="backdrop-blur-xl bg-white/85 rounded-full border border-slate-200/80 shadow-soft px-6 py-3 flex items-center justify-between gap-8 max-w-4xl w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              🔥
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight text-slate-900">DebugForge</span>
              <span className="text-[10px] text-cyan-600 font-mono font-medium leading-none">Autonomous Cyber Harness</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600">
            <a href="#problem" className="hover:text-slate-900 transition-colors">2026 Paradox</a>
            <a href="#pipeline" className="hover:text-slate-900 transition-colors">5-Stage Pipeline</a>
            <a href="#demo" className="hover:text-slate-900 transition-colors">Live Simulator</a>
            <a href="#comparison" className="hover:text-slate-900 transition-colors">Comparison</a>
            <a href="#quickstart" className="hover:text-slate-900 transition-colors">Quick Install</a>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/priyanshupk2022-arch/zeroshield"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-sm"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-36 pb-20 px-6 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-50 border border-cyan-200/70 text-cyan-800 text-xs font-semibold mb-6">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
          Built for The Agent Harness Hackathon (TrueFoundry x Qodo x WeMakeDevs)
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15] mb-6">
          AI writes code in seconds. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Debugging takes hours.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-10">
          <strong className="text-slate-800">DebugForge</strong> is the autonomous AI agent harness that reproduces, diagnoses, and auto-heals runtime bugs inside isolated Daytona sandboxes — with verified proof before code reaches production.
        </p>

        {/* Quick Install Bar (Hermes/Claude Code Style) */}
        <div id="quickstart" className="max-w-2xl mx-auto bg-white rounded-2xl p-2 border border-slate-200 shadow-soft mb-12">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 rounded-xl font-mono text-xs text-cyan-300 overflow-x-auto gap-4">
            <div className="flex items-center gap-2 text-left whitespace-nowrap">
              <span className="text-slate-500 select-none">$</span>
              <span>npm install -g @debugforge/cli && debugforge diagnose</span>
            </div>
            <button
              onClick={() => copyToClipboard("npm install -g @debugforge/cli && debugforge diagnose", "npm")}
              className="text-slate-400 hover:text-white p-1.5 rounded-md hover:bg-slate-800 transition-colors shrink-0"
              title="Copy to clipboard"
            >
              {copiedKey === "npm" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex justify-between items-center px-4 pt-2.5 text-[11px] text-slate-500 font-mono">
            <span>Also supports curl & PowerShell native one-line installers below</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Exit Code 0 Verified
            </span>
          </div>
        </div>

        {/* Platform Badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-700">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200">
            <Cpu className="w-3.5 h-3.5 text-blue-600" /> TrueForge Harness
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200">
            <Server className="w-3.5 h-3.5 text-cyan-600" /> Daytona Sandboxes
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Qodo Code Review
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> OpenAI Reasoning
          </span>
        </div>
      </section>

      {/* 2026 Developer Paradox Stats */}
      <section id="problem" className="py-16 bg-white border-y border-slate-200/80 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 font-mono">The 2026 Productivity Paradox</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">Why Developers Are Spending 38% of Their Week Debugging</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-sm text-center">
              <div className="text-3xl font-extrabold text-cyan-600 mb-2">67%</div>
              <p className="text-xs font-semibold text-slate-700 mb-1">More Debugging Overhead</p>
              <p className="text-[11px] text-slate-500">Developers report spending more time fixing almost-right AI code than writing code.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-sm text-center">
              <div className="text-3xl font-extrabold text-blue-600 mb-2">43%</div>
              <p className="text-xs font-semibold text-slate-700 mb-1">Post-Test Failure Rate</p>
              <p className="text-[11px] text-slate-500">AI-generated code still crashes in runtime even after passing superficial unit tests.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-sm text-center">
              <div className="text-3xl font-extrabold text-indigo-600 mb-2">15.5h</div>
              <p className="text-xs font-semibold text-slate-700 mb-1">Weekly Drain Per Engineer</p>
              <p className="text-[11px] text-slate-500">Nearly 2 full working days wasted deciphering unfamiliar LLM code structures.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-sm text-center">
              <div className="text-3xl font-extrabold text-red-600 mb-2">19%</div>
              <p className="text-xs font-semibold text-slate-700 mb-1">Net Task Slowdown</p>
              <p className="text-[11px] text-slate-500">METR study proved complex tasks take longer with AI due to debugging friction.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5-Stage Autonomous Pipeline */}
      <section id="pipeline" className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 font-mono">The 5-Stage Autonomous Pipeline</span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-2">How DebugForge Eliminates Guesswork</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            {
              step: "01",
              title: "Ingest Error",
              desc: "Parses stack traces, unhandled rejections, and test runner outputs into structured models.",
              icon: AlertTriangle,
              color: "text-red-500 bg-red-50 border-red-200"
            },
            {
              step: "02",
              title: "Reproduce",
              desc: "Spins up isolated Daytona sandbox and replicates failure with real exit codes.",
              icon: Server,
              color: "text-amber-500 bg-amber-50 border-amber-200"
            },
            {
              step: "03",
              title: "Trace Root Cause",
              desc: "Traces dynamic execution backwards from crash site to locate true infection origin.",
              icon: Activity,
              color: "text-blue-500 bg-blue-50 border-blue-200"
            },
            {
              step: "04",
              title: "Auto-Patch",
              desc: "Synthesizes surgical AST diffs and validates with Triple-Lock differential verification.",
              icon: FileCode,
              color: "text-cyan-500 bg-cyan-50 border-cyan-200"
            },
            {
              step: "05",
              title: "HITL Approval",
              desc: "Presents cryptographic sign-off gate before applying verified changes to repository.",
              icon: Lock,
              color: "text-emerald-500 bg-emerald-50 border-emerald-200"
            }
          ].map((item, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-soft flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold text-slate-400">{item.step}</span>
                  <div className={`p-2 rounded-xl border ${item.color}`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="font-bold text-sm text-slate-900 mb-2">{item.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Live Interactive Simulator */}
      <section id="demo" className="py-16 bg-slate-900 text-white px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">Live Terminal Simulator</span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-1">Watch DebugForge In Action</h2>
            </div>

            {/* Tab Selector */}
            <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-mono">
              <button
                onClick={() => setActiveTab("null")}
                className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === "null" ? "bg-cyan-500 text-white font-bold" : "text-slate-400 hover:text-white"}`}
              >
                1. Null Cascade
              </button>
              <button
                onClick={() => setActiveTab("race")}
                className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === "race" ? "bg-cyan-500 text-white font-bold" : "text-slate-400 hover:text-white"}`}
              >
                2. Race Condition
              </button>
              <button
                onClick={() => setActiveTab("memory")}
                className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === "memory" ? "bg-cyan-500 text-white font-bold" : "text-slate-400 hover:text-white"}`}
              >
                3. Memory Leak
              </button>
            </div>
          </div>

          {/* Terminal Box */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl p-6 font-mono text-xs leading-relaxed overflow-hidden">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800 text-slate-500 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
                <span className="ml-2 text-slate-400">debugforge-terminal — 80x24</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-cyan-400">Daytona Isolated Sandbox Active</span>
              </div>
            </div>

            <div className="space-y-3">
              {terminalLogs[activeTab].map((log, idx) => (
                <div key={idx} className="animate-fadeIn">
                  {log.type === "cmd" && <div className="text-cyan-300 font-bold">{log.text}</div>}
                  {log.type === "thought" && <div className="text-purple-300">{log.text}</div>}
                  {log.type === "event" && <div className="text-yellow-300">{log.text}</div>}
                  {log.type === "alert" && <div className="text-red-400 bg-red-950/40 p-2 rounded-lg border border-red-900/50">{log.text}</div>}
                  {log.type === "rca" && <div className="text-amber-300 bg-amber-950/40 p-2 rounded-lg border border-amber-900/50 whitespace-pre-wrap">{log.text}</div>}
                  {log.type === "patch" && <div className="text-blue-300">{log.text}</div>}
                  {log.type === "lock" && <div className="text-emerald-400 bg-emerald-950/40 p-3 rounded-lg border border-emerald-900/50 whitespace-pre-wrap">{log.text}</div>}
                  {log.type === "success" && <div className="text-emerald-300 font-bold">{log.text}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section id="comparison" className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 font-mono">Market Comparison</span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-2">Why DebugForge Stands in a League of Its Own</h2>
        </div>

        <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-soft">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 font-mono text-[11px] text-slate-600">
                <th className="py-4 px-6 font-bold">Feature Capability</th>
                <th className="py-4 px-6 font-bold">Cursor / Copilot</th>
                <th className="py-4 px-6 font-bold">Sentry / Datadog</th>
                <th className="py-4 px-6 font-bold">SWE-agent</th>
                <th className="py-4 px-6 font-bold text-cyan-700 bg-cyan-50/70">DebugForge (Ours)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-4 px-6 font-semibold text-slate-900">Isolated Sandbox Reproduction</td>
                <td className="py-4 px-6 text-slate-400">❌ Manual</td>
                <td className="py-4 px-6 text-slate-400">❌ None (Alert only)</td>
                <td className="py-4 px-6 text-slate-700">⚠️ Docker CLI</td>
                <td className="py-4 px-6 font-bold text-cyan-700 bg-cyan-50/40">✅ Ephemeral Daytona</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-semibold text-slate-900">Infection Origin vs Crash Site</td>
                <td className="py-4 px-6 text-slate-400">❌ Crash site band-aids</td>
                <td className="py-4 px-6 text-slate-400">❌ Stack frame only</td>
                <td className="py-4 px-6 text-slate-700">⚠️ Static grep</td>
                <td className="py-4 px-6 font-bold text-cyan-700 bg-cyan-50/40">✅ Dynamic Backward Trace</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-semibold text-slate-900">Triple-Lock Verification Gate</td>
                <td className="py-4 px-6 text-slate-400">❌ Does it compile?</td>
                <td className="py-4 px-6 text-slate-400">❌ Draft PR only</td>
                <td className="py-4 px-6 text-slate-700">⚠️ Test exit code</td>
                <td className="py-4 px-6 font-bold text-cyan-700 bg-cyan-50/40">✅ Fix + Regression + Stress</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-semibold text-slate-900">TrueForge MCP Tool Ecosystem</td>
                <td className="py-4 px-6 text-slate-400">❌ Proprietary</td>
                <td className="py-4 px-6 text-slate-400">❌ Proprietary</td>
                <td className="py-4 px-6 text-slate-400">❌ None</td>
                <td className="py-4 px-6 font-bold text-cyan-700 bg-cyan-50/40">✅ Native Open MCP</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-semibold text-slate-900">Qodo Automated Code Review</td>
                <td className="py-4 px-6 text-slate-400">❌ None</td>
                <td className="py-4 px-6 text-slate-400">❌ None</td>
                <td className="py-4 px-6 text-slate-400">❌ None</td>
                <td className="py-4 px-6 font-bold text-cyan-700 bg-cyan-50/40">✅ Native CI/CD Integration</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* One-Line Install Script Box */}
      <section className="py-16 bg-slate-100 border-t border-slate-200 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-3">Install DebugForge in Seconds</h2>
          <p className="text-xs text-slate-600 mb-8">One command sets up the entire autonomous CLI and TrueForge MCP tool registry.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left font-mono text-xs">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-sans font-bold uppercase mb-1">Linux / macOS / WSL2</span>
                <span className="text-slate-800">curl -fsSL https://git.io/debugforge | bash</span>
              </div>
              <button
                onClick={() => copyToClipboard("curl -fsSL https://git.io/debugforge | bash", "curl")}
                className="text-slate-400 hover:text-slate-900 p-2"
              >
                {copiedKey === "curl" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-sans font-bold uppercase mb-1">Windows Native PowerShell</span>
                <span className="text-slate-800">iex (irm https://git.io/debugforge.ps1)</span>
              </div>
              <button
                onClick={() => copyToClipboard("iex (irm https://git.io/debugforge.ps1)", "ps1")}
                className="text-slate-400 hover:text-slate-900 p-2"
              >
                {copiedKey === "ps1" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-white border-t border-slate-200 px-6 text-center text-xs text-slate-500 font-mono">
        <p>Built with ❤️ by Priyanshu for The Agent Harness Hackathon (TrueFoundry x Qodo x WeMakeDevs) • MIT Licensed</p>
      </footer>
    </div>
  );
}
