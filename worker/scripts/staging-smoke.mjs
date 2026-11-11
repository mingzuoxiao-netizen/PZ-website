// Read-only checks, isolated to the known staging Worker. No credentials or writes.
const origin = 'https://pz-inquiry-api-staging.mingzuoxiao29.workers.dev';
const configured = String(process.env.PZ_STAGING_URL || origin).replace(/\/+$/, '');
if (configured !== origin) throw Error('Safety stop: only the canonical staging Worker may be checked');
const expectedSha = process.env.GITHUB_SHA;
if (!/^[a-f0-9]{40}$/.test(expectedSha || '')) throw Error('Missing release SHA');
const get = async (path) => {
  const response = await fetch(origin + path, {
    headers: { Accept: 'application/json' },
    redirect: 'manual',
    cache: 'no-store',
    signal: AbortSignal.timeout(12000)
  });
  if (response.status !== 200) throw Error(path + ': HTTP ' + response.status);
  return response;
};
const version = await (await get('/version')).json();
if (version.git_sha !== expectedSha) throw Error('Staging Worker SHA does not match deployed commit');
await get('/public/products?v=2&limit=1'); // Direct Worker route (Pages proxies /api/products to /public/products).
await get('/api/site-config');
console.log('Staging version, product catalog and site-config smoke checks passed');
