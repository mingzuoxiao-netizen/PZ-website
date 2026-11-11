import test from 'node:test';
import assert from 'node:assert/strict';
import { latestProductionApproval, verifyProductionReview } from '../scripts/verify-production-review.mjs';

const approved = {
  state: 'approved',
  created_at: '2026-11-11T20:00:00Z',
  user: { login: 'release-reviewer' },
  environments: [{ name: 'production' }]
};
const env = { GITHUB_REPOSITORY: 'sample/repository', GITHUB_RUN_ID: '123456', GH_TOKEN: 'test-token' };
const reply = history => async () => ({ ok: true, status: 200, json: async () => history });

test('production requires a review for this run and production environment', () => {
  assert.equal(latestProductionApproval([]), null);
  assert.equal(latestProductionApproval([{ ...approved, environments: [{ name: 'staging' }] }]), null);
  assert.equal(latestProductionApproval([{ ...approved, state: 'rejected' }]), null);
  assert.deepEqual(latestProductionApproval([approved]), { user: 'release-reviewer', when: approved.created_at });
});

test('most recent production rejection invalidates an earlier approval', () => {
  const recentRejection = { ...approved, state: 'rejected', created_at: '2026-11-11T21:00:00Z' };
  assert.equal(latestProductionApproval([recentRejection, approved]), null);
});

test('read-only approval verification succeeds only for actual approved production record', async () => {
  const result = await verifyProductionReview({ env, fetcher: reply([approved]) });
  assert.equal(result.user, 'release-reviewer');
  await assert.rejects(
    verifyProductionReview({ env, fetcher: reply([{ ...approved, environments: [{ name: 'staging' }] }]) }),
    /no APPROVED GitHub Environment review/
  );
  await assert.rejects(
    verifyProductionReview({ env, fetcher: async () => ({ ok: false, status: 403 }) }),
    /HTTP 403/
  );
});
