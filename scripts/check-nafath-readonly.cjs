// Checks only configuration presence and the public JWK endpoint; never creates a verification session.
const fs = require('node:fs');
const dotenv = require('dotenv');
const env = { ...process.env, ...(fs.existsSync('.env') ? dotenv.parse(fs.readFileSync('.env')) : {}) };
const names = ['NAFATH_BASE_URL','NAFATH_APP_ID','NAFATH_APP_KEY','NAFATH_AUDIENCE','NAFATH_ISSUER','NAFATH_CLIENT_IP','NAFATH_RETURN_URL'];
const result = { presence: Object.fromEntries(names.map(name => [name, Boolean(env[name])])), jwkPath: env.NAFATH_JWK_PATH || '/api/v1/mfa/jwk' };
(async () => {
  if (!env.NAFATH_BASE_URL || !env.NAFATH_APP_ID || !env.NAFATH_APP_KEY) { result.endpointCheck = 'Not run: required local credentials are missing'; return; }
  const base = new URL(env.NAFATH_BASE_URL);
  result.baseHost = base.hostname; result.basePath = base.pathname;
  if (base.protocol !== 'https:' || base.username || base.password || !/(^|\.)(elm\.sa|rabet\.sa)$/.test(base.hostname)) throw new Error('Unexpected provider origin; credentials were not sent');
  const response = await fetch(base.href.replace(/\/+$/, '') + result.jwkPath, {
    method: 'GET', redirect: 'error', signal: AbortSignal.timeout(10000),
    headers: { 'APP-ID': env.NAFATH_APP_ID, 'APP-KEY': env.NAFATH_APP_KEY, app_id: env.NAFATH_APP_ID, app_key: env.NAFATH_APP_KEY, 'X-Forwarded-For': `127.0.0.1,${env.NAFATH_CLIENT_IP || '127.0.0.1'}` },
  });
  result.jwkHttpStatus = response.status;
  if (response.ok) { const value = await response.json(); result.hasKeySet = Array.isArray(value.keys) && value.keys.length > 0; }
})().catch(error => { result.endpointCheck = error.message; }).finally(() => console.log(JSON.stringify(result, null, 2)));
