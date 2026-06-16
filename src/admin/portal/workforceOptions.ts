/* Static option lists for the workforce UI (job titles, departments, tools,
 * workspaces). Pure constants — no state, no persistence. */

export const ROLE_OPTIONS = [
  // Leadership
  "CEO", "COO", "CTO", "CFO", "CMO", "CPO",
  "VP Product", "VP Engineering", "VP Sales", "VP Marketing", "VP Operations",
  // Product Management
  "Head of Product", "Senior Product Manager", "Product Manager", "Associate Product Manager",
  "Product Owner", "Product Analyst", "Product Strategist", "Growth Product Manager",
  // Engineering
  "Engineering Manager", "Tech Lead", "Senior Developer", "Full-Stack Developer",
  "Frontend Developer", "Backend Developer", "DevOps Engineer", "QA Engineer",
  "Data Engineer", "ML Engineer", "Mobile Developer",
  // Design
  "Head of Design", "Senior Product Designer", "Product Designer", "UX Researcher",
  "UI Designer", "Design System Lead", "Motion Designer",
  // Marketing
  "Marketing Director", "Marketing Manager", "Content Lead", "SEO Specialist",
  "Social Media Manager", "Brand Manager", "Performance Marketer", "Growth Manager",
  // Sales
  "Sales Director", "Sales Lead", "Account Executive", "Business Development Manager",
  "Key Account Manager", "Sales Operations", "Sales Analyst",
  // Operations
  "Operations Director", "Operations Manager", "Operations Executive",
  "Supply Chain Manager", "Logistics Coordinator", "Procurement Manager",
  // Finance
  "Finance Director", "Finance Manager", "Finance Analyst", "Accountant",
  "Accounts Payable", "Accounts Receivable", "Payroll Specialist",
  // HR & People
  "HR Director", "HR Manager", "HR Executive", "Talent Acquisition Lead",
  "People Operations", "L&D Manager",
  // Support
  "Support Manager", "Support Lead", "Support Specialist", "Customer Success Manager",
  // Data & Analytics
  "Data Lead", "Data Analyst", "Business Analyst", "BI Analyst",
  // Other
  "Project Manager", "Program Manager", "Scrum Master", "Agile Coach",
  "Legal Counsel", "Compliance Officer", "Office Manager", "Executive Assistant",
  "Intern",
];

export const DEPARTMENTS = [
  "Leadership", "Product", "Engineering", "Design", "Marketing",
  "Sales", "Operations", "Finance", "HR & People", "Support",
  "Data & Analytics", "Legal & Compliance",
];
export const WF_DEPARTMENTS = DEPARTMENTS;

export const TOOL_OPTIONS = [
  "Slack", "Notion", "Jira", "Linear", "Figma", "GitHub", "VS Code",
  "Google Workspace", "Zoom", "Loom", "Miro", "Confluence", "Trello",
  "HubSpot", "Salesforce", "Mixpanel", "Amplitude", "Hotjar",
  "Adobe Creative Suite", "Canva", "ChatGPT", "Claude", "Cursor",
  "AWS Console", "Vercel", "Render", "Docker", "Postman",
  "Excel / Sheets", "Power BI", "Tableau", "QuickBooks", "Tally",
  "WhatsApp Business", "Intercom", "Zendesk", "Freshdesk",
];

export const WORKSPACE_OPTIONS = [
  "Office — Ahmedabad", "Office — Surat", "Office — Rajkot", "Office — Vadodara",
  "Remote — India", "Remote — International", "Hybrid", "Field / On-site",
];
