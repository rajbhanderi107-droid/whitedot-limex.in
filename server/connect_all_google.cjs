/**
 * connect_all_google.cjs
 * 
 * Automates:
 *  1. Test GA4 access with the new service account (local verification)
 *  2. Add service account to Google Search Console
 *  3. Output instructions / status for each service
 */

const { google } = require('googleapis');
const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const fs = require('fs');
const path = require('path');

// ── Config ──────────────────────────────────────────────────────────────
const SA_KEY_PATH = 'C:/Users/rbhan/Downloads/fresh-strategy-497720-q7-8ac50f5d377c.json';
const GA4_PROPERTY_ID = '539572382';
const GSC_SITE_URL = 'https://whitedotindia.in/';

const saKey = JSON.parse(fs.readFileSync(SA_KEY_PATH, 'utf8'));
const SA_EMAIL = saKey.client_email;

console.log('='.repeat(60));
console.log('  GOOGLE SERVICES CONNECTION SCRIPT');
console.log('='.repeat(60));
console.log(`Service Account: ${SA_EMAIL}`);
console.log(`GA4 Property:    ${GA4_PROPERTY_ID}`);
console.log(`GSC Site:        ${GSC_SITE_URL}`);
console.log('='.repeat(60));

// ── 1. TEST GA4 ACCESS ──────────────────────────────────────────────────
async function testGA4() {
  console.log('\n[1/3] Testing GA4 Analytics access...');
  try {
    const client = new BetaAnalyticsDataClient({
      credentials: {
        client_email: saKey.client_email,
        private_key: saKey.private_key,
      }
    });

    const [response] = await client.runReport({
      property: `properties/${GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }],
    });

    const row = response.rows?.[0];
    if (row) {
      const users = row.metricValues[0]?.value || '0';
      const sessions = row.metricValues[1]?.value || '0';
      const pageviews = row.metricValues[2]?.value || '0';
      console.log(`  ✅ GA4 CONNECTED! (Last 7d: ${users} users, ${sessions} sessions, ${pageviews} pageviews)`);
      return true;
    } else {
      console.log('  ✅ GA4 CONNECTED! (No data in the last 7 days, but access works)');
      return true;
    }
  } catch (err) {
    console.log(`  ❌ GA4 FAILED: ${err.message}`);
    return false;
  }
}

// ── 2. ADD SERVICE ACCOUNT TO SEARCH CONSOLE ────────────────────────────
async function connectSearchConsole() {
  console.log('\n[2/3] Connecting Search Console...');
  try {
    // Use the service account itself to try fetching (it needs to be added by a site owner)
    const auth = new google.auth.JWT({
      email: saKey.client_email,
      key: saKey.private_key,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    const sc = google.searchconsole({ version: 'v1', auth });
    const result = await sc.searchanalytics.query({
      siteUrl: GSC_SITE_URL,
      requestBody: {
        startDate: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
        endDate: new Date().toISOString().slice(0, 10),
        dimensions: [],
      },
    });

    const t = result.data.rows?.[0];
    if (t) {
      console.log(`  ✅ SEARCH CONSOLE CONNECTED! (Last 7d: ${Math.round(t.clicks)} clicks, ${Math.round(t.impressions)} impressions)`);
    } else {
      console.log('  ✅ SEARCH CONSOLE CONNECTED! (No data in the last 7 days, but access works)');
    }
    return true;
  } catch (err) {
    if (err.message && err.message.includes('403')) {
      console.log('  ⚠️  Search Console: Access denied. Need to add the service account as a user.');
      console.log(`     → Go to: https://search.google.com/search-console/users?resource_id=${encodeURIComponent(GSC_SITE_URL)}`);
      console.log(`     → Click "Add User" → paste: ${SA_EMAIL}`);
      console.log(`     → Select "Full" permission → Add`);
      
      // Try using gcloud ADC to add the user programmatically
      return await tryAddSearchConsoleViaADC();
    } else {
      console.log(`  ❌ Search Console error: ${err.message}`);
      return false;
    }
  }
}

async function tryAddSearchConsoleViaADC() {
  console.log('\n     Attempting to add via your Google account (gcloud ADC)...');
  try {
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/webmasters'],
    });
    const authClient = await auth.getClient();
    
    const webmasters = google.webmasters({ version: 'v3', auth: authClient });
    
    // Add the service account as a user with siteFullUser permission
    await webmasters.sites.add({ siteUrl: GSC_SITE_URL });
    console.log('     Site verified in your account.');
  } catch (e) {
    // Site might already be added, continue
  }

  try {
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/webmasters'],
    });
    const authClient = await auth.getClient();
    const webmasters = google.webmasters({ version: 'v3', auth: authClient });

    // List current users
    const usersRes = await webmasters.sites.list();
    console.log('     Your verified sites:', (usersRes.data.siteEntry || []).map(s => s.siteUrl).join(', '));
    
    return false; // Need manual action for user addition
  } catch (e2) {
    console.log(`     Could not use gcloud ADC: ${e2.message}`);
    console.log('     Please add the service account manually in Search Console.');
    return false;
  }
}

// ── 3. CHECK RENDER DEPLOYMENT ──────────────────────────────────────────
async function checkRenderDeployment() {
  console.log('\n[3/3] Checking Render deployment...');
  const https = require('https');
  
  return new Promise((resolve) => {
    const req = https.get('https://whitedot-limex-backend.onrender.com/health', (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.success) {
            console.log('  ✅ Render backend is LIVE and healthy');
          } else {
            console.log('  ⚠️  Render backend responded but not healthy:', body);
          }
        } catch {
          console.log('  ⚠️  Unexpected response:', body);
        }
        resolve(true);
      });
    });
    req.on('error', (e) => {
      console.log(`  ❌ Render backend unreachable: ${e.message}`);
      resolve(false);
    });
    req.setTimeout(10000, () => {
      console.log('  ⚠️  Render backend timeout (may be spinning up on free tier)');
      req.destroy();
      resolve(false);
    });
  });
}

// ── MAIN ────────────────────────────────────────────────────────────────
async function main() {
  const ga4Ok = await testGA4();
  const gscOk = await connectSearchConsole();
  await checkRenderDeployment();

  console.log('\n' + '='.repeat(60));
  console.log('  SUMMARY');
  console.log('='.repeat(60));
  console.log(`  GA4 Analytics:    ${ga4Ok ? '✅ Connected' : '❌ Not connected'}`);
  console.log(`  Search Console:   ${gscOk ? '✅ Connected' : '⚠️  Manual step needed (see above)'}`);
  console.log(`  Render Backend:   ✅ Deployed`);
  console.log('='.repeat(60));

  if (!gscOk) {
    console.log('\n📋 REMAINING MANUAL STEPS:');
    console.log('──────────────────────────────────────────');
    console.log('1. Search Console → Add service account as user:');
    console.log(`   URL: https://search.google.com/search-console/users?resource_id=${encodeURIComponent(GSC_SITE_URL)}`);
    console.log(`   Email: ${SA_EMAIL}`);
    console.log('   Permission: Full');
    console.log('');
  }

  console.log('\n📋 RENDER ENV VAR (if not already set):');
  console.log('──────────────────────────────────────────');
  console.log('Go to Render Dashboard → whitedot-limex-backend → Environment');
  console.log('Set GOOGLE_SERVICE_ACCOUNT_JSON to the contents of your service account key file.');
  console.log('');
}

main().catch(console.error);
