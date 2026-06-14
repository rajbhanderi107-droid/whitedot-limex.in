/**
 * Mint a least-privilege (webmasters.readonly) refresh token for the backend.
 * Uses the gcloud installed-app OAuth client (loopback redirect allowed).
 * Saves the result to _gsc_token.json (gitignored temp) — NOT printed.
 */
const { google } = require('googleapis');
const http = require('http');
const fs = require('fs');

const adc = JSON.parse(fs.readFileSync(
  'C:/Users/rbhan/AppData/Roaming/gcloud/application_default_credentials.json', 'utf8'));

const CLIENT_ID = adc.client_id;
const CLIENT_SECRET = adc.client_secret;
const QUOTA_PROJECT = 'fresh-strategy-497720-q7';
const REDIRECT = 'http://localhost:9876/oauth2callback';
const PORT = 9876;

const oauth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT);
const authUrl = oauth.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/webmasters.readonly'],
});

console.log('AUTH_URL:' + authUrl);

let done = false;
const server = http.createServer(async (req, res) => {
  if (done) return;
  const u = new URL(req.url, 'http://localhost:' + PORT);
  if (!u.pathname.includes('oauth2callback')) { res.end('waiting'); return; }
  const code = u.searchParams.get('code');
  if (!code) { res.writeHead(400); res.end('no code'); return; }
  done = true;
  res.end('<html><body style="font-family:sans-serif;padding:40px;background:#f0fdf4"><h2 style="color:#16a34a">Authorized. Close this tab.</h2></body></html>');
  try {
    const { tokens } = await oauth.getToken(code);
    oauth.setCredentials(tokens);
    oauth.quotaProjectId = QUOTA_PROJECT;
    if (!tokens.refresh_token) {
      console.log('RESULT:NO_REFRESH_TOKEN (revoke prior grant at myaccount.google.com/permissions then retry)');
      server.close(); return;
    }
    // verify read works
    const sc = google.searchconsole({ version: 'v1', auth: oauth });
    const r = await sc.searchanalytics.query({
      siteUrl: 'https://whitedotindia.in/',
      requestBody: {
        startDate: new Date(Date.now() - 28 * 86400000).toISOString().slice(0, 10),
        endDate: new Date().toISOString().slice(0, 10),
        dimensions: [],
      },
    });
    const t = r.data.rows?.[0];
    fs.writeFileSync(__dirname + '/_gsc_token.json', JSON.stringify({
      GSC_OAUTH_CLIENT_ID: CLIENT_ID,
      GSC_OAUTH_CLIENT_SECRET: CLIENT_SECRET,
      GSC_OAUTH_REFRESH_TOKEN: tokens.refresh_token,
      GSC_QUOTA_PROJECT: QUOTA_PROJECT,
      GSC_SITE_URL: 'https://whitedotindia.in/',
      _verify: { clicks: Math.round(t?.clicks || 0), impressions: Math.round(t?.impressions || 0) },
      _scope: 'webmasters.readonly',
    }, null, 2));
    console.log(`RESULT:OK verify clicks=${Math.round(t?.clicks||0)} impr=${Math.round(t?.impressions||0)} -> saved _gsc_token.json`);
  } catch (e) {
    console.log('RESULT:ERROR ' + e.message);
  }
  server.close();
});
server.listen(PORT, 'localhost', () => console.log('LISTENING:' + PORT));
server.on('error', e => { console.log('SERVER_ERR:' + e.message); process.exit(1); });
