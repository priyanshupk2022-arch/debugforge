import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/server.js';

describe('Vulnerable SQL Injection App Test Suite', () => {
  it('should expose app instance correctly', () => {
    assert.ok(app);
  });
});
