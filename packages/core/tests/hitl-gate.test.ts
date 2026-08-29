import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';
import { HITLApprovalTool } from '../src/tools/hitl-approval.js';
import { PatchProposal } from '../src/types/index.js';

describe('HITLApprovalTool', () => {
  const tool = new HITLApprovalTool();
  const mockProposal: PatchProposal = {
    patchId: 'patch_12345',
    targetFile: 'src/db.ts',
    diff: '+ throw new Error("Pool timeout");',
    explanation: 'Fixes null cascade',
    tripleLockStatus: {
      lock1OriginalPass: true,
      lock2RegressionPass: true,
      lock3StressPass: true,
    },
  };

  test('auto-approves when autoApprove flag is set', async () => {
    const res = await tool.execute({
      sessionId: 'sess_1',
      proposal: mockProposal,
      autoApprove: true,
    });

    assert.equal(res.decision, 'APPLY');
    assert.ok(res.signature);
    assert.match(res.operator, /TrueForge HITL/);
  });

  test('delegates to custom HITL handler function', async () => {
    const customHandler = async () => 'REJECT' as const;

    const res = await tool.execute(
      {
        sessionId: 'sess_2',
        proposal: mockProposal,
        autoApprove: false,
      },
      customHandler
    );

    assert.equal(res.decision, 'REJECT');
    assert.ok(res.signature);
    assert.match(res.feedback || '', /Rejected/);
  });
});
