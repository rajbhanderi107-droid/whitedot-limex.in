const { google } = require('googleapis');
const fs = require('fs');

const key1Path = 'C:/Users/rbhan/Downloads/fresh-strategy-497720-q7-8ac50f5d377c.json';
const key2Path = 'C:/Users/rbhan/Downloads/whitedot-4eaa5-dashboard-key.json';

async function listSites(keyPath, label) {
  console.log(`\n=== Testing key: ${label} (${keyPath}) ===`);
  try {
    const saKey = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    const auth = new google.auth.JWT({
      email: saKey.client_email,
      key: saKey.private_key,
      scopes: [
        'https://www.googleapis.com/auth/webmasters.readonly',
        'https://www.googleapis.com/auth/analytics.readonly'
      ],
    });

    const sc = google.searchconsole({ version: 'v1', auth });
    const res = await sc.sites.list();
    const sites = res.data.siteEntry || [];
    console.log(`Search Console Sites for ${saKey.client_email}:`);
    if (sites.length === 0) {
      console.log('  No sites found.');
    } else {
      sites.forEach(s => {
        console.log(`  - URL: ${s.siteUrl}, Permission: ${s.permissionLevel}`);
      });
    }

    // Try GA4 properties listing if we can
    try {
      const admin = google.analyticsadmin({
        version: 'v1beta',
        auth
      });
      const accountsRes = await admin.accounts.list();
      const accounts = accountsRes.data.accounts || [];
      console.log(`GA4 Accounts for ${saKey.client_email}:`);
      for (const acc of accounts) {
        console.log(`  - Account: ${acc.displayName} (${acc.name})`);
        const propsRes = await admin.properties.list({ filter: `parent:${acc.name}` });
        const props = propsRes.data.properties || [];
        for (const p of props) {
          console.log(`    - Property: ${p.displayName} (${p.name})`);
        }
      }
    } catch (gaErr) {
      console.log(`  GA4 error: ${gaErr.message}`);
    }

  } catch (err) {
    console.log(`  Error: ${err.message}`);
  }
}

async function main() {
  await listSites(key1Path, 'fresh-strategy-497720-q7');
  await listSites(key2Path, 'whitedot-4eaa5');
}

main();
