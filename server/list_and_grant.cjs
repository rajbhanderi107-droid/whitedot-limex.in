const { google } = require('googleapis');

// Use Application Default Credentials (user's gcloud login session)
const auth = new google.auth.GoogleAuth({
  scopes: [
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/analytics.manage.users'
  ]
});

const serviceAccountEmail = 'whitedot-dashboard@fresh-strategy-497720-q7.iam.gserviceaccount.com';

async function run() {
  try {
    const authClient = await auth.getClient();
    google.options({ auth: authClient });

    const admin = google.analyticsadmin({ version: 'v1beta' });

    console.log("Listing accounts...");
    const accountsRes = await admin.accounts.list();
    const accounts = accountsRes.data.accounts || [];
    console.log(`Found ${accounts.length} accounts.`);

    for (const acc of accounts) {
      console.log(`\nAccount: ${acc.displayName} (${acc.name})`);
      
      console.log(`Listing properties...`);
      const propsRes = await admin.properties.list({
        filter: `parent:${acc.name}`
      });
      const properties = propsRes.data.properties || [];
      console.log(`Found ${properties.length} properties.`);

      for (const prop of properties) {
        console.log(`- Property: ${prop.displayName} (${prop.name})`);
        
        console.log(`  Adding service account (${serviceAccountEmail}) to this property...`);
        try {
          const bindingRes = await admin.properties.accessBindings.create({
            parent: prop.name,
            requestBody: {
              emailAddress: serviceAccountEmail,
              roles: ['predefinedRoles/viewer']
            }
          });
          console.log(`  SUCCESS! Created access binding: ${bindingRes.data.name}`);
        } catch (bindErr) {
          console.error(`  Failed to add user:`, bindErr.message || bindErr);
        }
      }
    }

  } catch (err) {
    console.error("Error:", err.message || err);
  }
}

run();
