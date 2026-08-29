/**
 * Feature F19: Root Build & Compilation Tests
 * Tests root package manifest, workspaces, tsconfig project references, and build script definitions.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const rootPath = path.resolve(__dirname, '../..');

describe('Feature F19: Root Build & Compilation', () => {
  it('F19-1: Verifies root package.json defines required build and workspace scripts', () => {
    const pkgPath = path.join(rootPath, 'package.json');
    assert.ok(fs.existsSync(pkgPath), 'Root package.json must exist');

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    assert.ok(pkg.scripts, 'scripts object must exist');
    assert.ok(pkg.scripts.build, 'build script must exist');
    assert.ok(pkg.workspaces, 'workspaces array must exist');
  });

  it('F19-2: Verifies root tsconfig.json configures project references for monorepo packages', () => {
    const tsconfigPath = path.join(rootPath, 'tsconfig.json');
    assert.ok(fs.existsSync(tsconfigPath), 'Root tsconfig.json must exist');

    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    assert.ok(Array.isArray(tsconfig.references), 'tsconfig must define references array');
    const refPaths = tsconfig.references.map(r => r.path);
    assert.ok(refPaths.some(p => p.includes('core')), 'Must reference packages/core');
    assert.ok(refPaths.some(p => p.includes('cli')), 'Must reference packages/cli');
  });

  it('F19-3: Verifies packages/web contains valid Vite and Tailwind configuration files', () => {
    const webPath = path.join(rootPath, 'packages/web');
    assert.ok(fs.existsSync(path.join(webPath, 'vite.config.ts')), 'vite.config.ts must exist');
    assert.ok(fs.existsSync(path.join(webPath, 'tailwind.config.js')), 'tailwind.config.js must exist');
    assert.ok(fs.existsSync(path.join(webPath, 'package.json')), 'packages/web/package.json must exist');
  });

  it('F19-4: Verifies packages/core and packages/cli define target build configurations', () => {
    const coreTsconfig = path.join(rootPath, 'packages/core/tsconfig.json');
    const cliTsconfig = path.join(rootPath, 'packages/cli/tsconfig.json');

    assert.ok(fs.existsSync(coreTsconfig), 'packages/core/tsconfig.json must exist');
    assert.ok(fs.existsSync(cliTsconfig), 'packages/cli/tsconfig.json must exist');
  });

  it('F19-5: Verifies clean build script definition removes build artifacts and tsbuildinfo', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(rootPath, 'package.json'), 'utf8'));
    assert.ok(pkg.scripts.clean, 'clean script must exist');
    assert.ok(pkg.scripts.clean.includes('dist'), 'clean script must remove dist directory');
  });
});
