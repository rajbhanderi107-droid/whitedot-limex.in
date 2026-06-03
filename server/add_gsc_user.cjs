/**
 * add_gsc_user.cjs  — v4
 *
 * Adds the service account as a Search Console user using the correct
 * webmasters v3 permissions.add method.
 *
 * Run:
 *   $env:OAUTH_CLIENT_ID='YOUR_ID'; $env:OAUTH_CLIENT_SECRET='YOUR_SECRET'; node add_gsc_user.cjs
 */

const { google } = require('googleapis');
const http  = require('http');
const https = require('https');

// ── Config ────────────────────────────────────────────────────────────────
const CLIENT_ID     = process.env.OAUTH_CLIENT_ID     || '';
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET || '';
const SITE_URL              = 'https://whitedotindia.in/';
const SERVICE_ACCOUNT_EMAIL = 'whitedot-dashboard@fresh-strategy-497720-q7.iam.gserviceaccount.com';
const REDIRECT_URI          = 'http://localhost:9876/oauth2callback';
// ─────────────────────────────────────────────────────────────────────────

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('\n❌  Set OAUTH_CLIENT_ID and OAUTH_CLIENT_SECRET env vars.\n');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/webmasters'],
});

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║         SEARCH CONSOLE — ADD SERVICE ACCOUNT            ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');
console.log('Open this URL → sign in as the site OWNER → click Allow:\n');
console.log('  ' + authUrl + '\n');

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
    <h2 style="color:#16a34a">✅ Authenticated! Close this tab.</h2>
    <p>Check your terminal for the result.</p>
  </body></html>`);

  // Exchange code for tokens
  console.log('[2/3] Exchanging code for tokens…');
  let token;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    token = tokens.access_token;
    console.log('      ✅ Tokens obtained.\n');
  } catch (e) {
    console.error('❌  Token exchange failed:', e.message);
    server.close();
    return;
  }

  console.log(`[3/3] Adding ${SERVICE_ACCOUNT_EMAIL}`);
  console.log(`      to Search Console site: ${SITE_URL}\n`);

  try {
    // ── Step 1: list sites to find exact siteUrl key ─────────────────────
    const webmasters = google.webmasters({ version: 'v3', auth: oauth2Client });
    const sitesRes = await webmasters.sites.list();
    const sites = sitesRes.data.siteEntry || [];

    console.log('   Sites in your account:');
    sites.forEach(s => console.log(`     • ${s.siteUrl}  [${s.permissionLevel}]`));
    console.log('');

    const norm = u => u.replace(/\/$/, '').toLowerCase();
    const target = sites.find(s =>
      norm(s.siteUrl) === norm(SITE_URL) ||
      norm(SITE_URL).startsWith(norm(s.siteUrl))
    );

    if (!target) {
      console.error(`❌  "${SITE_URL}" not found. Sign in with the OWNER account.`);
      server.close();
      return;
    }
    console.log(`   Matched: ${target.siteUrl}\n`);

    // ── Step 2: add permission via REST using raw HTTPS to Search Console
    // API v1 (webmasters v3 permissions is deprecated; use searchconsole v1)
    // Correct endpoint: POST https://searchconsole.googleapis.com/v1/sites/{siteUrl}/users
    const body = JSON.stringify({
      permissionLevel: 'siteFullUser',
      email: SERVICE_ACCOUNT_EMAIL,
    });

    // Double-encode the siteUrl (Google requires it)
    const encodedSite = encodeURIComponent(target.siteUrl);

    const result = await new Promise((resolve, reject) => {
      const req2 = https.request({
        hostname: 'searchconsole.googleapis.com',
        path:     `/v1/sites/${encodedSite}/users`,
        method:   'POST',
        headers: {
          'Authorization':  `Bearer ${token}`,
          'Content-Type':   'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      }, r => {
        let d = '';
        r.on('data', c => d += c);
        r.on('end', () => {
          console.log(`   API response ${r.statusCode}: ${d}`);
          if (r.statusCode >= 200 && r.statusCode < 300) {
            resolve(d);
          } else if (r.statusCode === 409 || d.includes('already')) {
            console.log('   ℹ️  Already added — that is fine!');
            resolve(d);
          } else {
            reject(new Error(`HTTP ${r.statusCode}: ${d}`));
          }
        });
      });
      req2.on('error', reject);
      req2.write(body);
      req2.end();
    });

    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║  ✅  SUCCESS! Service account added to Search Console.  ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('\n   Now run:  node connect_all_google.cjs  — to verify.\n');

  } catch (e) {
    console.error('\n❌  Failed:', e.message);
    if (e.message?.includes('403')) {
      console.error('   → Must be signed in as the site OWNER.\n');
    }
  }

  server.close();
});

server.listen(9876, 'localhost', () => {
  console.log('Listening on http://localhost:9876 …\n');
});

server.on('error', e => {
  if (e.code === 'EADDRINUSE') console.error('❌  Port 9876 in use — restart terminal.');
  else console.error('Server error:', e.message);
  process.exit(1);
});
