/**
 * Read-only audit check AFTER GitHub's Required reviewers protection.
 * The job cannot deploy without a recorded approval for THIS workflow run.
 * API: GET /repos/{owner}/{repo}/actions/runs/{run_id}/approvals
 */
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export function latestProductionApproval(history) {
  if (!Array.isArray(history)) return null;
  const relevant = history.filter(entry =>
    Array.isArray(entry?.environments) &&
    entry.environments.some(env => String(env?.name || '').toLowerCase() === 'production')
  );
  const latest = relevant.sort((a, b) =>
    new Date(a.submitted_at || a.created_at || 0).getTime() -
    new Date(b.submitted_at || b.created_at || 0).getTime()
  ).at(-1);
  if (!latest || String(latest.state).toLowerCase() !== 'approved' || !latest.user?.login)
    return null;
  return { user: latest.user.login, when: latest.submitted_at || latest.created_at || '' };
}

export async function verifyProductionReview({ env = process.env, fetcher = fetch } = {}) {
  const repository = env.GITHUB_REPOSITORY || '';
  const runId = env.GITHUB_RUN_ID || '';
  const token = env.GH_TOKEN || '';
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository) ||
      !/^\d+$/.test(runId) || !token)
    throw Error('Missing GitHub workflow identity or Actions read token for production approval audit');
  const url = 'https://api.github.com/repos/' + repository + '/actions/runs/' + runId + '/approvals';
  const response = await fetcher(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: 'Bearer ' + token,
      'X-GitHub-Api-Version': '2022-11-28'
    },
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) throw Error('GitHub deployment approval verification failed (HTTP ' + response.status + ')');
  const approval = latestProductionApproval(await response.json());
  if (!approval)
    throw Error('Production deployment blocked: no APPROVED GitHub Environment review for this workflow run');
  console.log('Verified GitHub Environment production approval by ' + approval.user + ' at ' + approval.when);
  return approval;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await verifyProductionReview();
