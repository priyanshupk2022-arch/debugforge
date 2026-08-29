/**
 * DebugForge Test Harness - Sandbox Runner Implementations
 * Supports MockSandboxRunner and LocalProcessSandboxRunner
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

class MockSandboxRunner {
  constructor(options = {}) {
    this.workspaces = new Map();
    this.options = options;
  }

  async createWorkspace(sourcePath) {
    const workspaceId = `mock_ws_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const tempDir = path.join(os.tmpdir(), `debugforge_sandbox_${workspaceId}`);
    fs.mkdirSync(tempDir, { recursive: true });

    if (sourcePath && fs.existsSync(sourcePath)) {
      this._copyRecursive(sourcePath, tempDir);
    }

    this.workspaces.set(workspaceId, {
      id: workspaceId,
      path: tempDir,
      createdAt: new Date().toISOString(),
      active: true,
    });

    return workspaceId;
  }

  async executeCommand(workspaceId, command, env = {}) {
    const ws = this.workspaces.get(workspaceId);
    if (!ws || !ws.active) {
      throw new Error(`Workspace ${workspaceId} not found or inactive`);
    }

    const startTime = Date.now();
    
    // Check if custom mock handler is registered
    if (this.options.commandHandler) {
      const mockResult = await this.options.commandHandler(workspaceId, command, ws.path);
      if (mockResult) return mockResult;
    }

    // Default execution in workspace directory
    try {
      const result = spawnSync(command, {
        cwd: ws.path,
        shell: true,
        encoding: 'utf8',
        timeout: this.options.timeout || 15000,
        env: { ...process.env, ...env },
      });

      const durationMs = Date.now() - startTime;
      const stdout = result.stdout || '';
      const stderr = result.stderr || (result.error ? result.error.message : '');
      const exitCode = result.status !== null ? result.status : (result.error ? 1 : 0);

      return {
        sandboxId: workspaceId,
        sandboxType: 'local',
        reproduced: exitCode !== 0,
        exitCode,
        stdout,
        stderr,
        durationMs,
        matchedSignature: true,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        sandboxId: workspaceId,
        sandboxType: 'local',
        reproduced: true,
        exitCode: 1,
        stdout: '',
        stderr: err.message,
        durationMs: Date.now() - startTime,
        matchedSignature: true,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async readFile(workspaceId, relativePath) {
    const ws = this.workspaces.get(workspaceId);
    if (!ws || !ws.active) throw new Error(`Workspace ${workspaceId} inactive`);
    const fullPath = path.join(ws.path, relativePath);
    return fs.readFileSync(fullPath, 'utf8');
  }

  async writeFile(workspaceId, relativePath, content) {
    const ws = this.workspaces.get(workspaceId);
    if (!ws || !ws.active) throw new Error(`Workspace ${workspaceId} inactive`);
    const fullPath = path.join(ws.path, relativePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf8');
  }

  async destroyWorkspace(workspaceId) {
    const ws = this.workspaces.get(workspaceId);
    if (ws) {
      ws.active = false;
      try {
        fs.rmSync(ws.path, { recursive: true, force: true });
      } catch (e) {
        // Ignore cleanup failure
      }
      this.workspaces.delete(workspaceId);
    }
  }

  _copyRecursive(src, dest) {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        this._copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

class LocalProcessSandboxRunner extends MockSandboxRunner {
  constructor(options = {}) {
    super(options);
  }
}

module.exports = {
  MockSandboxRunner,
  LocalProcessSandboxRunner,
};
