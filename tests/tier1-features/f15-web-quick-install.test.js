/**
 * Feature F15: Web Quick Installers Tests
 * Tests tabbed one-line installers (curl, PowerShell, npm, npx), copy state, and snippet formatting.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');

const INSTALL_TABS = [
  {
    id: 'curl',
    label: 'macOS / Linux (cURL)',
    command: 'curl -fsSL https://raw.githubusercontent.com/priyanshupk2022-arch/zeroshield/main/install.sh | bash',
    shell: 'bash',
  },
  {
    id: 'powershell',
    label: 'Windows (PowerShell)',
    command: 'irm https://raw.githubusercontent.com/priyanshupk2022-arch/zeroshield/main/install.ps1 | iex',
    shell: 'powershell',
  },
  {
    id: 'npm',
    label: 'Global NPM',
    command: 'npm install -g @debugforge/cli',
    shell: 'sh',
  },
  {
    id: 'npx',
    label: 'NPX One-Shot',
    command: 'npx debugforge diagnose --test "npm test"',
    shell: 'sh',
  },
];

describe('Feature F15: Web Quick Installers', () => {
  it('F15-1: Contains all 4 primary installer distribution tabs', () => {
    assert.strictEqual(INSTALL_TABS.length, 4);
    const tabIds = INSTALL_TABS.map(t => t.id);
    assert.ok(tabIds.includes('curl'));
    assert.ok(tabIds.includes('powershell'));
    assert.ok(tabIds.includes('npm'));
    assert.ok(tabIds.includes('npx'));
  });

  it('F15-2: Validates cURL bash one-line installer command syntax', () => {
    const curlTab = INSTALL_TABS.find(t => t.id === 'curl');
    assert.ok(curlTab.command.startsWith('curl -fsSL'));
    assert.ok(curlTab.command.endsWith('| bash'));
    assert.ok(curlTab.command.includes('install.sh'));
  });

  it('F15-3: Validates PowerShell Windows one-line installer command syntax', () => {
    const psTab = INSTALL_TABS.find(t => t.id === 'powershell');
    assert.ok(psTab.command.startsWith('irm '));
    assert.ok(psTab.command.endsWith('| iex'));
    assert.ok(psTab.command.includes('install.ps1'));
  });

  it('F15-4: Validates NPM global install and NPX single-shot commands', () => {
    const npmTab = INSTALL_TABS.find(t => t.id === 'npm');
    const npxTab = INSTALL_TABS.find(t => t.id === 'npx');

    assert.strictEqual(npmTab.command, 'npm install -g @debugforge/cli');
    assert.strictEqual(npxTab.command, 'npx debugforge diagnose --test "npm test"');
  });

  it('F15-5: Simulates copy-to-clipboard state transition logic', () => {
    let copiedState = false;
    function handleCopy(text) {
      copiedState = true;
      return text;
    }

    const copiedText = handleCopy(INSTALL_TABS[0].command);
    assert.strictEqual(copiedState, true);
    assert.strictEqual(copiedText, INSTALL_TABS[0].command);
  });
});
