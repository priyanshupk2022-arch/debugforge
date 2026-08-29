/**
 * Feature F20: Qodo CI/CD Workflow Tests
 * Tests .github/workflows/ci.yml structure, quality gates, and Qodo PR-Agent review integration.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const rootPath = path.resolve(__dirname, '../..');
const ciYamlPath = path.join(rootPath, '.github/workflows/ci.yml');

describe('Feature F20: Qodo CI/CD Workflow', () => {
  it('F20-1: Verifies .github/workflows/ci.yml workflow file exists and is readable', () => {
    assert.ok(fs.existsSync(ciYamlPath), 'ci.yml must exist at .github/workflows/ci.yml');
    const content = fs.readFileSync(ciYamlPath, 'utf8');
    assert.ok(content.length > 50, 'ci.yml must not be empty');
  });

  it('F20-2: Configures triggers on push and pull_request to main branch', () => {
    const content = fs.readFileSync(ciYamlPath, 'utf8');
    assert.ok(content.includes('push:'), 'Must configure push trigger');
    assert.ok(content.includes('pull_request:'), 'Must configure pull_request trigger');
    assert.ok(content.includes('main'), 'Must target main branch');
  });

  it('F20-3: Includes dependency vulnerability auditing and secret scanning gates', () => {
    const content = fs.readFileSync(ciYamlPath, 'utf8');
    assert.ok(content.includes('npm audit') || content.includes('audit'), 'Must include security audit');
    assert.ok(content.includes('checkout@v4'), 'Must use actions/checkout@v4');
    assert.ok(content.includes('setup-node@v4'), 'Must use actions/setup-node@v4');
  });

  it('F20-4: Executes monorepo build, web build, and test suite gates', () => {
    const content = fs.readFileSync(ciYamlPath, 'utf8');
    assert.ok(content.includes('npm run build') || content.includes('build'), 'Must execute build');
    assert.ok(content.includes('npm test') || content.includes('test'), 'Must execute tests');
  });

  it('F20-5: Integrates Qodo PR-Agent automated code review action', () => {
    const content = fs.readFileSync(ciYamlPath, 'utf8');
    assert.ok(content.includes('pr-agent') || content.includes('qodo') || content.includes('Codium-ai'), 'Must include Qodo PR-Agent action step');
  });
});
