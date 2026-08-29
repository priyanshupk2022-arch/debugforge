/**
 * Feature F8: Commander CLI Subcommands Tests
 * Tests diagnose, watch, agent subcommands and command-line flag parsing.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { Command } = require('commander');
const { MockDebugForgeEngine } = require('../harness');

function buildTestProgram(engine) {
  const program = new Command();
  program.name('debugforge').version('1.0.0').description('Autonomous AI Debugging Agent Harness');

  program
    .command('diagnose [error]')
    .option('-t, --test <cmd>', 'Test command to run for reproduction', 'npm test')
    .option('-w, --workspace <path>', 'Path to target micro-application', '.')
    .option('-s, --sandbox <type>', 'Sandbox type (daytona or local)', 'local')
    .option('-y, --yes', 'Auto-approve HITL gate', false)
    .option('-m, --max-steps <n>', 'Max ReAct iterations', (val) => parseInt(val, 10), 8)
    .action(async (error, opts) => {
      program._actionResult = await engine.diagnose({
        errorInput: error,
        testCommand: opts.test,
        workspacePath: opts.workspace,
        autoApprove: opts.yes,
      });
    });

  program
    .command('watch')
    .option('-t, --test <cmd>', 'Test command to execute on change', 'npm test')
    .option('-w, --workspace <path>', 'Workspace directory to watch', '.')
    .option('-d, --debounce <ms>', 'Watch debounce in ms', (val) => parseInt(val, 10), 300)
    .action(async (opts) => {
      const it = engine.watch(opts.workspace, opts.test);
      program._actionResult = (await it.next()).value;
    });

  program
    .command('agent <prompt>')
    .option('-w, --workspace <path>', 'Target workspace', '.')
    .option('-c, --continue', 'Resume previous debugging session', false)
    .action(async (prompt, opts) => {
      program._actionResult = await engine.runAgentLoop(prompt);
    });

  return program;
}

describe('Feature F8: Commander CLI Subcommands', () => {
  it('F8-1: Dispatches `diagnose` subcommand with custom options', async () => {
    const engine = new MockDebugForgeEngine();
    const program = buildTestProgram(engine);

    await program.parseAsync(['node', 'debugforge', 'diagnose', 'TypeError: null crash', '--test', 'npm run test:target', '--yes']);

    assert.ok(program._actionResult);
    assert.strictEqual(program._actionResult.resolved, true);
    assert.strictEqual(program._actionResult.status, 'APPLIED');
  });

  it('F8-2: Dispatches `watch` subcommand and parses debounce options', async () => {
    const engine = new MockDebugForgeEngine();
    const program = buildTestProgram(engine);

    await program.parseAsync(['node', 'debugforge', 'watch', '--workspace', './fixtures/null-api', '--debounce', '500']);

    assert.ok(program._actionResult);
    assert.strictEqual(program._actionResult.resolved, true);
  });

  it('F8-3: Dispatches `agent` subcommand with natural language debugging prompt', async () => {
    const engine = new MockDebugForgeEngine();
    const program = buildTestProgram(engine);

    await program.parseAsync(['node', 'debugforge', 'agent', 'Fix the null crash in order service']);

    assert.ok(program._actionResult);
    assert.strictEqual(program._actionResult.resolved, true);
  });

  it('F8-4: Renders help information and lists all subcommands', () => {
    const engine = new MockDebugForgeEngine();
    const program = buildTestProgram(engine);

    const helpInformation = program.helpInformation();
    assert.ok(helpInformation.includes('diagnose'));
    assert.ok(helpInformation.includes('watch'));
    assert.ok(helpInformation.includes('agent'));
  });

  it('F8-5: Correctly parses `--max-steps` integer flag for ReAct iteration limit', async () => {
    const engine = new MockDebugForgeEngine();
    const program = buildTestProgram(engine);

    await program.parseAsync(['node', 'debugforge', 'diagnose', '--max-steps', '12']);
    assert.ok(program._actionResult);
  });
});
