# WhiteDot CRM — Google Workspace Dashboard Setup

## 1. Google Sheets (Live CRM Data)

### Steps:
1. Go to [sheets.new](https://sheets.new) — creates a new Google Sheet
2. Name it: **"WhiteDot CRM Dashboard"**
3. Go to **Extensions → Apps Script**
4. Delete the default `Code.gs` content
5. Paste the entire contents of `AppScript.gs` from this folder
6. Click **Save** (Ctrl+S)
7. Click **Run** → select `onOpen` → click **Run**
8. Authorize when prompted (allow access to Google Sheets + external URLs)
9. Go back to your Sheet — you'll see a **"WhiteDot CRM"** menu
10. Click **WhiteDot CRM → Sync All Data**

### Auto-Sync (Optional):
1. In Apps Script, go to **Triggers** (clock icon, left sidebar)
2. Click **+ Add Trigger**
3. Settings:
   - Function: `autoSync`
   - Event source: Time-driven
   - Type: Hour timer
   - Interval: Every 1 hour
4. Click **Save**

---

## 2. Google Looker Studio (Visual Analytics)

### Steps:
1. Go to [lookerstudio.google.com](https://lookerstudio.google.com)
2. Click **Create → Report**
3. Add data source → **Google Sheets**
4. Select your **"WhiteDot CRM Dashboard"** sheet
5. Add the following sheets as data sources:
   - `Dashboard` (for KPIs)
   - `Inquiries` (for pipeline charts)
   - `Quote Requests` (for quote funnel)
   - `Sample Requests` (for sample tracking)

### Suggested Charts:
- **Scorecard**: Total Inquiries, Quotes, Samples, Companies
- **Pie chart**: Inquiry Status breakdown
- **Bar chart**: Quote pipeline by status
- **Time series**: Inquiries over time (use Created column)
- **Table**: Recent inquiries with status colors

---

## 3. Google Sign-In (Admin Panel Auth)

See `google-oauth-setup.md` for configuring Google OAuth
on the whitedot-backend Express server.

### Quick Summary:
1. Create OAuth credentials at console.cloud.google.com
2. Install passport-google-oauth20 in whitedot-backend
3. Add Google login route alongside existing JWT auth
4. Restrict to your domain/email whitelist
