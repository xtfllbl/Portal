const fs = require("fs");

const excluded = new Set([
  "25.merchant_lead.html",
  "27.INTL_PSP_merchant_lead.html",
  "30.landing_page_requirements.html",
  "31.prepaid_card_requirements.html",
  "33.INTL_PSP_merchant_lead_elavon.html",
  "38.Merchant_onboard_elavon_public.html",
  "38.Merchant_onboard_nuvei_public.html",
  "38.Merchant_onboarding_progress.html"
]);

const files = fs.readdirSync(".")
  .filter((file) => /^(?:[1-9]|40\.)/.test(file) && file.endsWith(".html") && !excluded.has(file))
  .sort();

const sharedContentCssPages = new Set([
  "2.resellermerchantterminal.html",
  "5.merchant_add_device_iso.html",
  "5.merchant_add_iso.html",
  "5.merchant_add_merchant_only_iso.html",
  "5.merchant_detail_iso.html",
  "5.merchant_detail_no_store_iso.html",
  "5.merchant_device_settings_iso.html",
  "5.merchant_manage_iso.html",
  "26.partner_information.html",
  "28.UPT_merchant_lead_detail.html",
  "29.INTL_PSP_merchant_lead_list.html"
]);

const fontLink = '  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20,400,0,0&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">';
const shellLink = '  <link rel="stylesheet" href="styles/platform-admin-shell.css">';
const shellScript = '  <script src="scripts/platform-admin-shell.js"></script>';

for (const file of files) {
  let html = fs.readFileSync(file, "utf8");
  html = html
    .replace(/^\s*<script src="scripts\/merchant-admin-shell\.js"><\/script>\s*$/gm, "")
    .replace(/^\s*<link rel="stylesheet" href="styles\/platform-admin-shell\.css"\s*\/?>\s*$/gm, "");

  const headLines = [];
  if (!html.includes("Material+Symbols+Rounded")) headLines.push(fontLink);
  if (sharedContentCssPages.has(file) && !html.includes("styles/merchant-admin-unified.css")) {
    headLines.push('  <link rel="stylesheet" href="styles/merchant-admin-unified.css">');
  }
  headLines.push(shellLink);
  if (headLines.length) html = html.replace(/\s*<\/head>/i, `\n${headLines.join("\n")}\n</head>`);
  html = html.replace(/\n\s*<script src="scripts\/platform-admin-shell\.js"><\/script>/g, "");
  const bodyClose = html.toLowerCase().lastIndexOf("</body>");
  if (bodyClose === -1) throw new Error(`${file} does not contain a closing body tag`);
  html = `${html.slice(0, bodyClose).replace(/\s*$/, "")}\n${shellScript}\n${html.slice(bodyClose)}`;
  fs.writeFileSync(file, html);
}

console.log(`Applied the shared platform shell to ${files.length} pages.`);
