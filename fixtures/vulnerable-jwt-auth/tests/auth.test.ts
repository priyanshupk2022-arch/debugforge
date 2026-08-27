import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'http';
import { createApp } from '../src/server.ts';
import { jwt, getUserFromToken } from '../src/routes/auth.ts';

describe('Vulnerable JWT Auth Test Suite', () => {
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

  it('jwt.sign and getUserFromToken encode and decode payload without signature verification', () => {
    const token = jwt.sign({ username: 'alice', role: 'user' });
    const payload = getUserFromToken(token);

    assert.ok(payload);
    assert.equal(payload?.username, 'alice');
    assert.equal(payload?.role, 'user');
  });

  it('GET /health returns 200 and service health status', async () => {
    const response = await fetch(`${baseUrl}/health`);
    assert.equal(response.status, 200);
    const body = (await response.json()) as { status: string; service: string };
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'vulnerable-jwt-auth');
  });

  it('GET /api/user/profile succeeds with valid token', async () => {
    const validToken = jwt.sign({ username: 'bob', role: 'member' });
    const response = await fetch(`${baseUrl}/api/user/profile`, {
      headers: { Authorization: `Bearer ${validToken}` },
    });

    assert.equal(response.status, 200);
    const body = (await response.json()) as { status: string; profile: { username: string; role: string } };
    assert.equal(body.status, 'profile retrieved');
    assert.equal(body.profile.username, 'bob');
  });

  it('GET /api/user/profile returns 401 when authorization header is missing', async () => {
    const response = await fetch(`${baseUrl}/api/user/profile`);
    assert.equal(response.status, 401);
    const body = (await response.json()) as { error: string };
    assert.equal(body.error, 'Missing authorization header');
  });
});
