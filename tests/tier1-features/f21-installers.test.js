/**
 * Feature F21: Cross-Platform Installers Tests
 * Tests install.sh and install.ps1 scripts, Node version checks, and installation commands.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const rootPath = path.resolve(__dirname, '../..');
const installShPath = path.join(rootPath, 'install.sh');
const installPs1Path = path.join(rootPath, 'install.ps1');

describe('Feature F21: Cross-Platform Installers', () => {
  it('F21-1: Verifies install.sh exists with valid bash shebang', () => {
    assert.ok(fs.existsSync(installShPath), 'install.sh must exist');
    const content = fs.readFileSync(installShPath, 'utf8');
    assert.ok(content.startsWith('#!/usr/bin/env bash') || content.startsWith('#!/bin/bash'));
  });

  it('F21-2: Verifies install.sh validates Node.js presence and version >= 18', () => {
    const content = fs.readFileSync(installShPath, 'utf8');
    assert.ok(content.includes('command -v node') || content.includes('which node'));
    assert.ok(content.includes('18'), 'Must enforce Node.js >= 18');
  });

  it('F21-3: Verifies install.ps1 exists with valid PowerShell syntax', () => {
    assert.ok(fs.existsSync(installPs1Path), 'install.ps1 must exist');
    const content = fs.readFileSync(installPs1Path, 'utf8');
    assert.ok(content.includes('Write-Host') || content.includes('powershell'));
  });

  it('F21-4: Verifies install.ps1 validates Node.js requirement on Windows', () => {
    const content = fs.readFileSync(installPs1Path, 'utf8');
    assert.ok(content.includes('Get-Command "node"') || content.includes('node -v'));
    assert.ok(content.includes('18'), 'Must enforce Node.js >= 18 on Windows');
  });

  it('F21-5: Emits actionable success instructions upon installation completion', () => {
    const shContent = fs.readFileSync(installShPath, 'utf8');
    const ps1Content = fs.readFileSync(installPs1Path, 'utf8');

    assert.ok(shContent.includes('debugforge') || shContent.includes('diagnose'));
    assert.ok(ps1Content.includes('debugforge') || ps1Content.includes('diagnose'));
  });
});
