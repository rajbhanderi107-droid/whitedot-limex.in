/**
 * save_gsc_token.cjs
 *
 * The correct approach for Search Console:
 * Google removed the permissions API for service accounts.
 * Instead, we do a one-time OAuth flow as the site OWNER and save
 * the refresh token to the backend .env file.
 *
 * The backend then uses this refresh token to query Search Console.
 *
 * Run:
 *   $env:OAUTH_CLIENT_ID='YOUR_ID'; $env:OAUTH_CLIENT_SECRET='YOUR_SECRET'; node save_gsc_token.cjs
 */

const { google } = require('googleapis');
const http = require('http');
const fs   = require('fs');
const path = require('path');

// ── Config ────────────────────────────────────────────────────────────────
const CLIENT_ID     = process.env.OAUTH_CLIENT_ID     || '';
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET || '';
const REDIRECT_URI  = 'http://localhost:9876/oauth2callback';
const ENV_FILE      = path.join(__dirname, '.env');
// ─────────────────────────────────────────────────────────────────────────

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('\n❌  Set OAUTH_CLIENT_ID and OAUTH_CLIENT_SECRET first.\n');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',  // forces refresh_token to be returned
  scope: [
    'https://www.googleapis.com/auth/webmasters.readonly',
  ],
});

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║   SEARCH CONSOLE — SAVE OAUTH TOKEN TO .env               ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');
console.log('Open this URL → sign in as the site OWNER → click Allow:\n');
console.log('  ' + authUrl + '\n');
console.log('(The terminal captures the response and saves the token.)\n');

let handled = false;

const server = http.createServer(async (req, res) => {
  if (handled) return;

  const parsed = new URL(req.url, 'http://localhost:9876');
  if (!parsed.pathname.includes('oauth2callback')) { res.end('Waiting…'); return; }

  handled = true;
  const code = parsed.searchParams.get('code');

  if (!code) {
    res.writeHead(400);
    res.end('<h2>No code. Try again.</h2>');
    server.close();
    return;
  }

  res.end(`<html><body style="font-family:sans-serif;padding:40px;background:#f0fdf4">
    <h2 style="color:#16a34a">✅ Authorized! Close this tab.</h2>
    <p>Check your terminal — the token is being saved to .env</p>
  </body></html>`);

  console.log('[2/3] Exchanging code for tokens…');
  let tokens;
  try {
    const result = await oauth2Client.getToken(code);
    tokens = result.tokens;
    oauth2Client.setCredentials(tokens);
    console.log('      ✅ Tokens obtained.');
    console.log(`      Refresh token: ${tokens.refresh_token ? '✅ received' : '❌ NOT received (try again)'}\n`);
  } catch (e) {
    console.error('❌  Token exchange failed:', e.message);
    server.close();
    return;
  }

  if (!tokens.refresh_token) {
    console.error('❌  No refresh token received. This can happen if you already authorized before.');
    console.error('   Go to https://myaccount.google.com/permissions and revoke access to this app,');
    console.error('   then run this script again.\n');
    server.close();
    return;
  }

  // Test the token works
  console.log('[3/3] Testing Search Console access…');
  try {
    const webmasters = google.webmasters({ version: 'v3', auth: oauth2Client });
    const sitesRes = await webmasters.sites.list();
    const sites = sitesRes.data.siteEntry || [];
    console.log('      ✅ Search Console access confirmed!');
    console.log('      Your sites:');
    sites.forEach(s => console.log(`        • ${s.siteUrl}  [${s.permissionLevel}]`));
    console.log('');
  } catch (e) {
    console.error('      ⚠️  Could not list sites:', e.message);
  }

  // Save to .env file
  console.log('Saving to .env…');
  try {
    let envContent = fs.readFileSync(ENV_FILE, 'utf8');

    // Add or update GSC_OAUTH_CLIENT_ID
    const addOrUpdate = (key, value) => {
      const escaped = value.replace(/\n/g, '\\n');
      if (envContent.includes(`${key}=`)) {
        envContent = envContent.replace(
          new RegExp(`^${key}=.*$`, 'm'),
          `${key}="${escaped}"`
        );
      } else {
        envContent += `\n${key}="${escaped}"\n`;
      }
    };

    addOrUpdate('GSC_OAUTH_CLIENT_ID', CLIENT_ID);
    addOrUpdate('GSC_OAUTH_CLIENT_SECRET', CLIENT_SECRET);
    addOrUpdate('GSC_OAUTH_REFRESH_TOKEN', tokens.refresh_token);

    fs.writeFileSync(ENV_FILE, envContent);
    console.log('✅  Saved to server/.env:\n');
    console.log('    GSC_OAUTH_CLIENT_ID    = set');
    console.log('    GSC_OAUTH_CLIENT_SECRET = set');
    console.log('    GSC_OAUTH_REFRESH_TOKEN = set\n');
  } catch (e) {
    console.error('❌  Could not write .env:', e.message);
    console.log('\nManually add these to server/.env:\n');
    console.log(`GSC_OAUTH_CLIENT_ID="${CLIENT_ID}"`);
    console.log(`GSC_OAUTH_CLIENT_SECRET="${CLIENT_SECRET}"`);
    console.log(`GSC_OAUTH_REFRESH_TOKEN="${tokens.refresh_token}"\n`);
  }

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  ✅  DONE! The backend will now use this token for GSC.    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  console.log('Next step: the backend google.service.ts needs to be updated');
  console.log('to use GSC_OAUTH_REFRESH_TOKEN instead of a service account.');
  console.log('This will be done automatically — tell Antigravity "done".\n');

  server.close();
});

server.listen(9876, 'localhost', () => {
  console.log('Listening on http://localhost:9876 …\n');
});

server.on('error', e => {
  if (e.code === 'EADDRINUSE') console.error('❌  Port 9876 in use — restart terminal and try again.');
  else console.error('Server error:', e.message);
  process.exit(1);
});
