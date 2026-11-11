/**
 * A second, read-only audit check AFTER GitHub's required-reviewer gate.
 * Fail closed if the production deployment has no recorded GitHub approval.
 * GitHub API: GET /repos/{owner}/{repo}/actions/runs/{run_id}/approvals
 */
const repository = process.env.GITHUB_REPOSITORY || '';
const runId = process.env.GITHUB_RUN_ID || '';
const token = process.env.GH_TOKEN || '';
if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository) ||
    !/^\d+$/.test(runId) || !token)
  throw Error('Missing GitHub workflow identity or Actions read token for production approval audit');

const url = 'https://api.github.com/repos/' + repository + '/actions/runs/' + runId + '/approvals';
const response = await fetch(url, {
  headers: {
    Accept: 'application/vnd.github+json',
    Authorization: 'Bearer ' + token,
    'X-GitHub-Api-Version': '2022-11-28'
  },
  signal: AbortSignal.timeout(12000)
});
if (!response.ok) throw Error('GitHub deployment approval verification failed (HTTP ' + response.status + ')');
const history = await response.json();
if (!Array.isArray(history)) throw Error('Invalid GitHub deployment review history');
const environmentEvents = history.filter(entry =>
  Array.isArray(entry?.environments) &&
  entry.environments.some(env => String(env?.name || '').toLowerCase() === 'production')
);
const latest = environmentEvents.sort((a, b) =>
  new Date(a.submitted_at || a.created_at || 0).getTime() -
  new Date(b.submitted_at || b.created_at || 0).getTime()
).at(-1);
if (!latest || String(latest.state).toLowerCase() !== 'approved' || !latest.user?.login)
  throw Error('Production deployment blocked: no APPROVED GitHub Environment review for this workflow run');
const when = latest.submitted_at || latest.created_at || 'timestamp unavailable';
console.log('Verified GitHub Environment production approval by ' + latest.user.login + ' at ' + when);
