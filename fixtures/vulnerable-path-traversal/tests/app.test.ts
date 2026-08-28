import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/server.js';

describe('Vulnerable Path Traversal App Test Suite', () => {
  it('should expose app instance correctly', () => {
    assert.ok(app);
  });
});
