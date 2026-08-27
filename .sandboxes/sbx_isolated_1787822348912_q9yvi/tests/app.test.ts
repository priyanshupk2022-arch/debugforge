import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'http';
import { createApp } from '../src/server.ts';

describe('Vulnerable Payment App Test Suite', () => {
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
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  });

  it('GET /health returns 200 and service health status', async () => {
    const response = await fetch(`${baseUrl}/health`);
    assert.equal(response.status, 200);
    const body = (await response.json()) as { status: string; service: string };
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'vulnerable-payment-app');
  });

  it('POST /api/report generates report with valid input parameters', async () => {
    const response = await fetch(`${baseUrl}/api/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: '--summary-only' }),
    });

    assert.equal(response.status, 200);
    const body = (await response.json()) as { status: string; output: string };
    assert.equal(body.status, 'Report generated successfully');
    assert.ok(body.output.includes('Generating report for: --summary-only'));
  });

  it('POST /api/report handles empty body gracefully', async () => {
    const response = await fetch(`${baseUrl}/api/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    assert.equal(response.status, 200);
    const body = (await response.json()) as { status: string; output: string };
    assert.equal(body.status, 'Report generated successfully');
    assert.ok(body.output.includes('Generating report for:'));
  });
});
