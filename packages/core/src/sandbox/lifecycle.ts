import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as net from 'net';
import { spawn, execSync, ChildProcess } from 'child_process';
import { Daytona, Sandbox } from '@daytona/sdk';

export interface SandboxExecutionResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export interface ISandboxInstance {
  readonly id: string;
  readonly type: 'DAYTONA_CONTAINER' | 'DOCKER_CONTAINER' | 'ISOLATED_CONTAINER_PROCESS';
  readonly workDir: string;
  readonly port: number;

  initWorkspace(sourceDir: string): Promise<void>;
  startService(entryRelativePath: string, portEnvName?: string): Promise<void>;
  stopService(): Promise<void>;
  restartService(entryRelativePath: string, portEnvName?: string): Promise<void>;
  writeFile(relativeFilePath: string, content: string): Promise<void>;
  readFile(relativeFilePath: string): Promise<string>;
  executeCommand(command: string, timeoutSec?: number): Promise<SandboxExecutionResult>;
  waitForPortReady(timeoutMs?: number): Promise<boolean>;
  dispatchHttp(options: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    headers?: Record<string, string>;
    bodyPayload?: Record<string, unknown>;
    timeoutMs?: number;
  }): Promise<{ statusCode: number; body: string; headers: http.IncomingHttpHeaders }>;
  destroy(): Promise<void>;
}

export function findProjectRoot(startPath: string): string {
  let curr = path.resolve(startPath);
  if (fs.existsSync(curr) && fs.statSync(curr).isFile()) {
    curr = path.dirname(curr);
  }
  while (curr && curr !== path.dirname(curr)) {
    if (fs.existsSync(path.join(curr, 'package.json'))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  return path.resolve(startPath);
}

export class LocalIsolatedSandbox implements ISandboxInstance {
  public readonly id: string;
  public readonly type = 'ISOLATED_CONTAINER_PROCESS' as const;
  public readonly workDir: string;
  public readonly port: number;
  private runningProcess: ChildProcess | null = null;

  constructor(sandboxId: string, isolatedWorkDir: string, port: number) {
    this.id = sandboxId;
    this.workDir = path.resolve(isolatedWorkDir);
    this.port = port;
  }

  public async initWorkspace(sourceDir: string): Promise<void> {
    const src = findProjectRoot(sourceDir);
    if (!fs.existsSync(src)) {
      throw new Error(`Source directory does not exist: ${src}`);
    }
    if (fs.existsSync(this.workDir)) {
      fs.rmSync(this.workDir, { recursive: true, force: true });
    }
    fs.mkdirSync(this.workDir, { recursive: true });
    fs.cpSync(src, this.workDir, { recursive: true });
  }

  public async startService(entryRelativePath: string, portEnvName = 'PORT'): Promise<void> {
    if (this.runningProcess) {
      await this.stopService();
    }

    const fullEntry = path.join(this.workDir, entryRelativePath);
    if (!fs.existsSync(fullEntry)) {
      throw new Error(`Target entry file not found in sandbox: ${fullEntry}`);
    }

    const isWin = process.platform === 'win32';
    const binary = isWin ? 'cmd.exe' : 'npx';
    const args = isWin
      ? ['/c', 'npx', 'ts-node', '--esm', entryRelativePath]
      : ['ts-node', '--esm', entryRelativePath];

    this.runningProcess = spawn(binary, args, {
      cwd: this.workDir,
      env: {
        ...process.env,
        [portEnvName]: this.port.toString(),
        NODE_ENV: 'sandbox_isolated',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
      windowsHide: true,
    });

    const isReady = await this.waitForPortReady(6000);
    if (!isReady) {
      await this.stopService();
      throw new Error(`Sandbox service failed to bind to port ${this.port} within readiness timeout.`);
    }
  }

  public async stopService(): Promise<void> {
    if (this.runningProcess) {
      const proc = this.runningProcess;
      this.runningProcess = null;
      if (proc.pid) {
        try {
          if (process.platform === 'win32') {
            execSync(`taskkill /pid ${proc.pid} /f /t`, { stdio: 'ignore' });
          } else {
            proc.kill('SIGKILL');
          }
        } catch {
          // ignore cleanup errors
        }
      }
      await new Promise(r => setTimeout(r, 200));
    }
  }

  public async restartService(entryRelativePath: string, portEnvName = 'PORT'): Promise<void> {
    await this.stopService();
    await this.startService(entryRelativePath, portEnvName);
  }

  public async writeFile(relativeFilePath: string, content: string): Promise<void> {
    const targetFile = path.join(this.workDir, relativeFilePath);
    fs.mkdirSync(path.dirname(targetFile), { recursive: true });
    fs.writeFileSync(targetFile, content, 'utf8');
  }

  public async readFile(relativeFilePath: string): Promise<string> {
    const targetFile = path.join(this.workDir, relativeFilePath);
    if (!fs.existsSync(targetFile)) {
      throw new Error(`File not found in sandbox: ${targetFile}`);
    }
    return fs.readFileSync(targetFile, 'utf8');
  }

  public async executeCommand(command: string, timeoutSec = 20): Promise<SandboxExecutionResult> {
    const start = Date.now();
    const isWin = process.platform === 'win32';
    const binary = isWin ? 'cmd.exe' : '/bin/sh';
    const args = isWin ? ['/c', command] : ['-c', command];

    return new Promise((resolve) => {
      const child = spawn(binary, args, {
        cwd: this.workDir,
        shell: false,
        env: {
          ...process.env,
          PORT: this.port.toString(),
        },
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (d) => (stdout += d.toString()));
      child.stderr?.on('data', (d) => (stderr += d.toString()));

      const timer = setTimeout(() => {
        child.kill();
        resolve({
          exitCode: 124,
          stdout,
          stderr: stderr + '\nCommand timed out in sandbox.',
          durationMs: Date.now() - start,
        });
      }, timeoutSec * 1000);

      child.on('close', (code) => {
        clearTimeout(timer);
        resolve({
          exitCode: code ?? 0,
          stdout,
          stderr,
          durationMs: Date.now() - start,
        });
      });
    });
  }

  public async waitForPortReady(timeoutMs = 6000): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const ready = await new Promise<boolean>((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(250);
        socket.once('connect', () => {
          socket.destroy();
          resolve(true);
        });
        socket.once('error', () => {
          socket.destroy();
          resolve(false);
        });
        socket.once('timeout', () => {
          socket.destroy();
          resolve(false);
        });
        socket.connect(this.port, '127.0.0.1');
      });

      if (ready) return true;
      await new Promise(r => setTimeout(r, 60));
    }
    return false;
  }

  public async dispatchHttp(options: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    headers?: Record<string, string>;
    bodyPayload?: Record<string, unknown>;
    timeoutMs?: number;
  }): Promise<{ statusCode: number; body: string; headers: http.IncomingHttpHeaders }> {
    const payload = options.bodyPayload ? JSON.stringify(options.bodyPayload) : '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload).toString(),
      ...(options.headers || {}),
    };

    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: this.port,
          path: options.path,
          method: options.method,
          headers,
          timeout: options.timeoutMs || 5000,
        },
        (res) => {
          let body = '';
          res.on('data', chunk => (body += chunk));
          res.on('end', () => {
            resolve({
              statusCode: res.statusCode || 500,
              body,
              headers: res.headers,
            });
          });
        }
      );

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Sandbox HTTP request timed out.'));
      });

      if (payload) req.write(payload);
      req.end();
    });
  }

  public async destroy(): Promise<void> {
    await this.stopService();
    if (fs.existsSync(this.workDir)) {
      try {
        fs.rmSync(this.workDir, { recursive: true, force: true });
      } catch {
        // ignore file lock cleanup delays
      }
    }
  }
}

export class DaytonaRemoteSandbox implements ISandboxInstance {
  public readonly id: string;
  public readonly type = 'DAYTONA_CONTAINER' as const;
  public readonly workDir: string;
  public readonly port: number;
  private sandbox: Sandbox;

  constructor(sandbox: Sandbox, port = 8080) {
    this.sandbox = sandbox;
    this.id = sandbox.id;
    this.port = port;
    this.workDir = '/workspace';
  }

  public async initWorkspace(sourceDir: string): Promise<void> {
    const src = findProjectRoot(sourceDir);
    await this.sandbox.waitUntilStarted(60);

    // Upload files into remote Daytona sandbox container
    const files = this.scanLocalFiles(src);
    for (const f of files) {
      const rel = path.relative(src, f).replace(/\\/g, '/');
      const content = fs.readFileSync(f);
      await this.sandbox.fs.uploadFile(content, path.posix.join('/workspace', rel));
    }

    // Install dependencies in Daytona container
    await this.sandbox.process.executeCommand('npm install', '/workspace');
  }

  public async startService(entryRelativePath: string, portEnvName = 'PORT'): Promise<void> {
    await this.sandbox.process.executeCommand(
      `nohup npx ts-node ${entryRelativePath} > /tmp/server.log 2>&1 &`,
      '/workspace',
      { [portEnvName]: this.port.toString() }
    );
    const ready = await this.waitForPortReady(15000);
    if (!ready) {
      throw new Error(`Daytona sandbox service failed to start and respond on preview port ${this.port}.`);
    }
  }

  public async stopService(): Promise<void> {
    await this.sandbox.process.executeCommand(`pkill -f ts-node || true`, '/workspace');
  }

  public async restartService(entryRelativePath: string, portEnvName = 'PORT'): Promise<void> {
    await this.stopService();
    await this.startService(entryRelativePath, portEnvName);
  }

  public async writeFile(relativeFilePath: string, content: string): Promise<void> {
    await this.sandbox.fs.uploadFile(Buffer.from(content, 'utf8'), path.posix.join('/workspace', relativeFilePath));
  }

  public async readFile(relativeFilePath: string): Promise<string> {
    const buf = await this.sandbox.fs.downloadFile(path.posix.join('/workspace', relativeFilePath));
    return buf.toString('utf8');
  }

  public async executeCommand(command: string, timeoutSec = 30): Promise<SandboxExecutionResult> {
    const start = Date.now();
    const res = await this.sandbox.process.executeCommand(command, '/workspace', undefined, timeoutSec);
    return {
      exitCode: res.exitCode,
      stdout: res.result || '',
      stderr: '',
      durationMs: Date.now() - start,
    };
  }

  public async waitForPortReady(timeoutMs = 15000): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const preview = await this.sandbox.getPreviewLink(this.port);
        const res = await fetch(preview.url, {
          method: 'GET',
          headers: preview.token ? { 'X-Daytona-Token': preview.token } : {},
          signal: AbortSignal.timeout(1000),
        });
        if (res.status >= 200 && res.status < 600) {
          return true;
        }
      } catch {
        // Port not yet listening or link initializing
      }
      await new Promise(r => setTimeout(r, 500));
    }
    return false;
  }

  public async dispatchHttp(options: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    headers?: Record<string, string>;
    bodyPayload?: Record<string, unknown>;
    timeoutMs?: number;
  }): Promise<{ statusCode: number; body: string; headers: http.IncomingHttpHeaders }> {
    const preview = await this.sandbox.getPreviewLink(this.port);
    const targetUrl = new URL(options.path, preview.url);

    const payload = options.bodyPayload ? JSON.stringify(options.bodyPayload) : '';
    const res = await fetch(targetUrl.toString(), {
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
        ...(preview.token ? { 'X-Daytona-Token': preview.token } : {}),
        ...(options.headers || {}),
      },
      body: options.method !== 'GET' ? payload : undefined,
    });

    const body = await res.text();
    const headers: http.IncomingHttpHeaders = {};
    res.headers.forEach((v, k) => {
      headers[k] = v;
    });

    return {
      statusCode: res.status,
      body,
      headers,
    };
  }

  public async destroy(): Promise<void> {
    await this.sandbox.delete(30, true);
  }

  private scanLocalFiles(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of list) {
      if (item.name === 'node_modules' || item.name === '.git' || item.name === 'dist') continue;
      const full = path.join(dir, item.name);
      if (item.isDirectory()) {
        results = results.concat(this.scanLocalFiles(full));
      } else {
        results.push(full);
      }
    }
    return results;
  }
}

export class SandboxFactory {
  public static async createSandbox(options: {
    sourceDir: string;
    port?: number;
    forceLocal?: boolean;
  }): Promise<ISandboxInstance> {
    const port = options.port || (3000 + Math.floor(Math.random() * 5000));
    const daytonaApiKey = process.env.DAYTONA_API_KEY;

    if (daytonaApiKey && !options.forceLocal) {
      const daytona = new Daytona({
        apiKey: daytonaApiKey,
        serverUrl: process.env.DAYTONA_SERVER_URL,
      });
      // Exactly ONE Daytona sandbox created per lifecycle
      const remoteInstance = await daytona.create({ language: 'typescript' });
      const sandbox = new DaytonaRemoteSandbox(remoteInstance, port);
      await sandbox.initWorkspace(options.sourceDir);
      return sandbox;
    }

    const sandboxId = `sbx_isolated_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const isolatedDir = path.resolve(process.cwd(), '.sandboxes', sandboxId);
    const sandbox = new LocalIsolatedSandbox(sandboxId, isolatedDir, port);
    await sandbox.initWorkspace(options.sourceDir);
    return sandbox;
  }
}
