import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'http';
import { createApp } from '../src/server.ts';
import { mergeConfig, resetConfigState } from '../src/routes/config.ts';

describe('Vulnerable Prototype Pollution Test Suite', () => {
  let server: Server;
  let baseUrl: string;

  before(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (typeof addr === 'object' && addr !== null) {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  after(async () => {
    resetConfigState();
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  });

  beforeEach(() => {
    resetConfigState();
  });

  it('mergeConfig correctly merges standard nested configuration objects', () => {
    const target = { theme: 'light', settings: { sound: true } };
    const source = { theme: 'dark', settings: { volume: 80 } };
    const result = mergeConfig(target, source);

    assert.equal(result.theme, 'dark');
    assert.equal(result.settings.sound, true);
    assert.equal(result.settings.volume, 80);
  });

  it('GET /health returns 200 and service health status', async () => {
    const response = await fetch(`${baseUrl}/health`);
    assert.equal(response.status, 200);
    const body = (await response.json()) as { status: string; service: string };
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'vulnerable-prototype-pollution');
  });

  it('POST /api/config/update successfully updates valid properties', async () => {
    const response = await fetch(`${baseUrl}/api/config/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: 'dark', notifications: true }),
    });

    assert.equal(response.status, 200);
    const body = (await response.json()) as { status: string; config: { theme: string; notifications: boolean } };
    assert.equal(body.status, 'Config updated');
    assert.equal(body.config.theme, 'dark');
    assert.equal(body.config.notifications, true);
  });

  it('demonstrates vulnerability when unsafe payload is processed', async () => {
    const payload = JSON.parse('{"__proto__": {"admin": true}}');
    const target: Record<string, any> = {};
    mergeConfig(target, payload);

    assert.equal(({} as any).admin, true);
    delete (Object.prototype as any).admin;
  });
});
