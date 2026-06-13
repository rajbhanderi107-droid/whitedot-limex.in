/**
 * WhiteDot CRM — Google Sheets Dashboard
 * Connects to Supabase REST API and syncs CRM data into sheets.
 *
 * SETUP:
 *   1. Create a new Google Sheet
 *   2. Extensions → Apps Script → paste this file
 *   3. Run onOpen() once to authorize
 *   4. Use the "WhiteDot CRM" menu to sync data
 *   5. (Optional) Add a time-driven trigger for autoSync() — every 1 hour
 */

// ─── Config ─────────────────────────────────────────────────
var CONFIG = {
  SUPABASE_URL: "https://yrsqtsejbvjwzegtkmkr.supabase.co",
  SUPABASE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlyc3F0c2VqYnZqd3plZ3RrbWtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDkyODAsImV4cCI6MjA5NTQ4NTI4MH0.BuTY3DwgQwzFcHhhqbHOxgs0db_4Rl9ShrETTGbhZps",
};

// ─── Menu ───────────────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("WhiteDot CRM")
    .addItem("Sync All Data", "syncAll")
    .addItem("Sync Inquiries", "syncInquiries")
    .addItem("Sync Companies", "syncCompanies")
    .addItem("Sync Quote Requests", "syncQuoteRequests")
    .addItem("Sync Sample Requests", "syncSampleRequests")
    .addItem("Sync Activity Log", "syncActivityLog")
    .addSeparator()
    .addItem("Create Summary Dashboard", "createSummarySheet")
    .addToUi();
}

// ─── Supabase REST Fetch ────────────────────────────────────
function supabaseFetch(table, selectFields, orderBy) {
  var url = CONFIG.SUPABASE_URL + "/rest/v1/" + table
    + "?select=" + encodeURIComponent(selectFields || "*")
    + "&order=" + encodeURIComponent(orderBy || "createdAt.desc")
    + "&limit=1000";

  var options = {
    method: "GET",
    headers: {
      "apikey": CONFIG.SUPABASE_KEY,
      "Authorization": "Bearer " + CONFIG.SUPABASE_KEY,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    },
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  var code = response.getResponseCode();

  if (code !== 200) {
    throw new Error("Supabase API error (" + code + "): " + response.getContentText());
  }

  return JSON.parse(response.getContentText());
}

// ─── Sheet Writer ───────────────────────────────────────────
function writeToSheet(sheetName, headers, rows) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  // Clear existing data
  sheet.clearContents();

  // Write headers
  if (headers.length > 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold")
      .setBackground("#1a1a2e")
      .setFontColor("#ffffff");
  }

  // Write data rows
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }

  // Auto-resize columns
  for (var i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
  }

  // Freeze header row
  sheet.setFrozenRows(1);

  return sheet;
}

// ─── Sync Functions ─────────────────────────────────────────

function syncInquiries() {
  var data = supabaseFetch(
    "Inquiry",
    "id,name,email,phone,companyName,designation,city,country,industry,inquiryType,message,sourcePage,status,priority,internalNotes,followUpDate,createdAt,updatedAt,assignedToId,companyId",
    "createdAt.desc"
  );

  var headers = [
    "ID", "Name", "Email", "Phone", "Company Name",
    "Designation", "City", "Country", "Industry", "Inquiry Type",
    "Message", "Source Page", "Status", "Priority", "Internal Notes",
    "Follow Up Date", "Created At", "Updated At", "Assigned To ID", "Company ID"
  ];

  var rows = data.map(function(r) {
    return [
      r.id, r.name, r.email, r.phone || "", r.companyName || "",
      r.designation || "", r.city || "", r.country || "", r.industry || "",
      r.inquiryType || "", r.message || "", r.sourcePage || "",
      r.status, r.priority, r.internalNotes || "", formatDate(r.followUpDate),
      formatDate(r.createdAt), formatDate(r.updatedAt), r.assignedToId || "", r.companyId || ""
    ];
  });

  writeToSheet("Inquiries", headers, rows);
  applyStatusColors("Inquiries", 12); // Status column index (0-based: 12 → col M)
  SpreadsheetApp.getActiveSpreadsheet().toast("Synced " + rows.length + " inquiries", "WhiteDot CRM");
}

/************************************************************************
 * Rest of functions...
 ************************************************************************/

function syncCompanies() {
  var data = supabaseFetch(
    "Company",
    "id,companyName,industry,contactPerson,email,phone,website,city,state,country,address,gstNumber,status,notes,createdAt,updatedAt",
    "createdAt.desc"
  );

  var headers = [
    "ID", "Company Name", "Industry", "Contact Person", "Email",
    "Phone", "Website", "City", "State", "Country", "Address",
    "GST Number", "Status", "Notes", "Created At", "Updated At"
  ];

  var rows = data.map(function(r) {
    return [
      r.id, r.companyName, r.industry || "", r.contactPerson || "",
      r.email || "", r.phone || "", r.website || "", r.city || "", r.state || "",
      r.country || "", r.address || "", r.gstNumber || "", r.status, r.notes || "",
      formatDate(r.createdAt), formatDate(r.updatedAt)
    ];
  });

  writeToSheet("Companies", headers, rows);
  SpreadsheetApp.getActiveSpreadsheet().toast("Synced " + rows.length + " companies", "WhiteDot CRM");
}

function syncQuoteRequests() {
  var data = supabaseFetch(
    "QuoteRequest",
    "id,contactPerson,email,phone,productCategory,currentMaterial,currentPlasticGrade,monthlyQuantity,targetApplication,strengthRequirement,foodContactRequired,colorRequirement,sustainabilityGoal,expectedPriceRange,message,status,priority,createdAt,updatedAt,assignedToId,companyId",
    "createdAt.desc"
  );

  var headers = [
    "ID", "Contact Person", "Email", "Phone", "Product Category",
    "Current Material", "Current Plastic Grade", "Monthly Quantity", "Target Application",
    "Strength Requirement", "Food Contact Required", "Color Requirement", "Sustainability Goal",
    "Expected Price Range", "Message", "Status", "Priority", "Created At", "Updated At",
    "Assigned To ID", "Company ID"
  ];

  var rows = data.map(function(r) {
    return [
      r.id, r.contactPerson, r.email, r.phone || "", r.productCategory || "",
      r.currentMaterial || "", r.currentPlasticGrade || "", r.monthlyQuantity || "",
      r.targetApplication || "", r.strengthRequirement || "", r.foodContactRequired ? "Yes" : "No",
      r.colorRequirement || "", r.sustainabilityGoal || "", r.expectedPriceRange || "",
      r.message || "", r.status, r.priority, formatDate(r.createdAt), formatDate(r.updatedAt),
      r.assignedToId || "", r.companyId || ""
    ];
  });

  writeToSheet("Quote Requests", headers, rows);
  SpreadsheetApp.getActiveSpreadsheet().toast("Synced " + rows.length + " quote requests", "WhiteDot CRM");
}

function syncSampleRequests() {
  var data = supabaseFetch(
    "SampleRequest",
    "id,contactPerson,email,phone,requestedMaterialType,application,quantity,deliveryAddress,courierTracking,status,remarks,createdAt,updatedAt,companyId",
    "createdAt.desc"
  );

  var headers = [
    "ID", "Contact Person", "Email", "Phone", "Requested Material Type",
    "Application", "Quantity", "Delivery Address", "Courier Tracking",
    "Status", "Remarks", "Created At", "Updated At", "Company ID"
  ];

  var rows = data.map(function(r) {
    return [
      r.id, r.contactPerson, r.email, r.phone || "", r.requestedMaterialType || "",
      r.application || "", r.quantity || "", r.deliveryAddress || "",
      r.courierTracking || "", r.status, r.remarks || "",
      formatDate(r.createdAt), formatDate(r.updatedAt), r.companyId || ""
    ];
  });

  writeToSheet("Sample Requests", headers, rows);
  SpreadsheetApp.getActiveSpreadsheet().toast("Synced " + rows.length + " sample requests", "WhiteDot CRM");
}

function syncActivityLog() {
  var data = supabaseFetch(
    "ActivityLog",
    "id,action,entityType,entityId,ipAddress,createdAt",
    "createdAt.desc"
  );

  var headers = ["ID", "Action", "Entity Type", "Entity ID", "IP Address", "Created"];

  var rows = data.map(function(r) {
    return [
      r.id, r.action, r.entityType, r.entityId || "",
      r.ipAddress || "", formatDate(r.createdAt)
    ];
  });

  writeToSheet("Activity Log", headers, rows);
  SpreadsheetApp.getActiveSpreadsheet().toast("Synced " + rows.length + " activity logs", "WhiteDot CRM");
}

// ─── Sync All ───────────────────────────────────────────────
function syncAll() {
  syncInquiries();
  syncCompanies();
  syncQuoteRequests();
  syncSampleRequests();
  syncActivityLog();
  createSummarySheet();
  SpreadsheetApp.getActiveSpreadsheet().toast("All data synced!", "WhiteDot CRM", 5);
}

// Auto-sync (for time-driven trigger)
function autoSync() {
  syncAll();
}

// ─── Summary Dashboard Sheet ────────────────────────────────
function createSummarySheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Dashboard");
  if (!sheet) {
    sheet = ss.insertSheet("Dashboard", 0); // Insert at first position
  }
  sheet.clearContents();

  // Fetch counts via Supabase
  var inquiries = supabaseFetch("Inquiry", "id,status", "createdAt.desc");
  var quotes = supabaseFetch("QuoteRequest", "id,status", "createdAt.desc");
  var samples = supabaseFetch("SampleRequest", "id,status", "createdAt.desc");
  var companies = supabaseFetch("Company", "id,status", "createdAt.desc");

  // Count by status
  var inquiryStats = countByField(inquiries, "status");
  var quoteStats = countByField(quotes, "status");
  var sampleStats = countByField(samples, "status");

  // Header
  sheet.getRange("A1").setValue("WhiteDot CRM Dashboard");
  sheet.getRange("A1").setFontSize(18).setFontWeight("bold").setFontColor("#1a1a2e");

  sheet.getRange("A2").setValue("Last synced: " + new Date().toLocaleString());
  sheet.getRange("A2").setFontColor("#666666");

  // KPI Cards (Row 4)
  var kpis = [
    ["Total Inquiries", inquiries.length],
    ["Total Quotes", quotes.length],
    ["Total Samples", samples.length],
    ["Total Companies", companies.length]
  ];

  for (var i = 0; i < kpis.length; i++) {
    var col = (i * 2) + 1;
    sheet.getRange(4, col).setValue(kpis[i][0]).setFontWeight("bold").setFontColor("#666");
    sheet.getRange(5, col).setValue(kpis[i][1]).setFontSize(28).setFontWeight("bold").setFontColor("#1a1a2e");
  }

  // Inquiry Status Breakdown (Row 8)
  sheet.getRange("A8").setValue("Inquiry Pipeline").setFontSize(14).setFontWeight("bold");
  var row = 9;
  sheet.getRange(row, 1).setValue("Status").setFontWeight("bold");
  sheet.getRange(row, 2).setValue("Count").setFontWeight("bold");
  row++;
  for (var status in inquiryStats) {
    sheet.getRange(row, 1).setValue(status);
    sheet.getRange(row, 2).setValue(inquiryStats[status]);
    row++;
  }

  // Quote Status Breakdown
  row += 1;
  sheet.getRange(row, 1).setValue("Quote Pipeline").setFontSize(14).setFontWeight("bold");
  row++;
  sheet.getRange(row, 1).setValue("Status").setFontWeight("bold");
  sheet.getRange(row, 2).setValue("Count").setFontWeight("bold");
  row++;
  for (var status in quoteStats) {
    sheet.getRange(row, 1).setValue(status);
    sheet.getRange(row, 2).setValue(quoteStats[status]);
    row++;
  }

  // Sample Status Breakdown
  row += 1;
  sheet.getRange(row, 1).setValue("Sample Pipeline").setFontSize(14).setFontWeight("bold");
  row++;
  sheet.getRange(row, 1).setValue("Status").setFontWeight("bold");
  sheet.getRange(row, 2).setValue("Count").setFontWeight("bold");
  row++;
  for (var status in sampleStats) {
    sheet.getRange(row, 1).setValue(status);
    sheet.getRange(row, 2).setValue(sampleStats[status]);
    row++;
  }

  // Auto-resize
  for (var c = 1; c <= 8; c++) {
    sheet.autoResizeColumn(c);
  }
}

// ─── Helpers ────────────────────────────────────────────────
function formatDate(isoString) {
  if (!isoString) return "";
  var d = new Date(isoString);
  return Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
}

function countByField(arr, field) {
  var counts = {};
  arr.forEach(function(item) {
    var val = item[field] || "Unknown";
    counts[val] = (counts[val] || 0) + 1;
  });
  return counts;
}

function applyStatusColors(sheetName, statusColIndex) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return;

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  var statusRange = sheet.getRange(2, statusColIndex + 1, lastRow - 1, 1);
  var values = statusRange.getValues();

  var colors = {
    "NEW": "#e3f2fd",
    "CONTACTED": "#fff3e0",
    "QUALIFIED": "#e8f5e9",
    "PROPOSAL_SENT": "#f3e5f5",
    "WON": "#c8e6c9",
    "LOST": "#ffcdd2",
    "ARCHIVED": "#f5f5f5",
    "REQUESTED": "#e3f2fd",
    "APPROVED": "#c8e6c9",
    "REJECTED": "#ffcdd2",
    "DISPATCHED": "#fff3e0",
    "DELIVERED": "#c8e6c9",
    "UNDER_REVIEW": "#fff3e0",
    "QUOTED": "#e8f5e9",
    "NEGOTIATION": "#f3e5f5"
  };

  var bgColors = values.map(function(row) {
    return [colors[row[0]] || "#ffffff"];
  });

  statusRange.setBackgrounds(bgColors);
}
