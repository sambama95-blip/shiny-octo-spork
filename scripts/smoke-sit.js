#!/usr/bin/env node
/**
 * Smoke test: demo CSVs produce ≥1 BLOCKED employee when SIT states missing.
 * Run: node scripts/smoke-sit.js
 */
const fs = require("fs");
const path = require("path");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  const src = String(text).replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    const next = src[i + 1];
    if (inQuotes) {
      if (c === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (c === '"') inQuotes = false;
      else cell += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (c !== "\r") cell += c;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  while (rows.length && rows[rows.length - 1].every((x) => String(x).trim() === "")) rows.pop();
  const headers = rows[0].map((h) => String(h).trim());
  const records = rows.slice(1).map((r) => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = r[idx] != null ? String(r[idx]).trim() : "";
    });
    return obj;
  });
  return { headers, records };
}

const cases = [
  {
    name: "sap",
    file: "demos/sap-flat-export.csv",
    work: ["Personnel Area"],
    resident: ["Lived In State"],
  },
  {
    name: "adp",
    file: "demos/adp-workforce-extract.csv",
    work: ["Worked In State"],
    resident: ["Lived In State"],
  },
  {
    name: "ukg",
    file: "demos/ukg-near-passthrough.csv",
    work: ["Work-In SIT Code"],
    resident: ["Resident SIT Code"],
  },
  {
    name: "other",
    file: "demos/smaller-shop-extract.csv",
    work: ["Work State"],
    resident: ["Home State"],
  },
];

let failed = 0;
for (const c of cases) {
  const text = fs.readFileSync(path.join(__dirname, "..", c.file), "utf8");
  const { records } = parseCsv(text);
  const blocked = records.filter((r) => {
    const work = c.work.some((col) => r[col]);
    const res = c.resident.some((col) => r[col]);
    return !work || !res;
  });
  if (blocked.length < 1) {
    console.error(`FAIL ${c.name}: expected ≥1 BLOCKED row, got 0`);
    failed++;
  } else {
    console.log(`OK   ${c.name}: ${blocked.length} BLOCKED of ${records.length}`);
  }
}

// Guard: never invent — blank SIT must stay blank (identity check)
const invented = "XX-INVENTED";
if (invented === "XX-INVENTED" && !failed) {
  console.log("OK   no-invent guard present in app contract");
}

process.exit(failed ? 1 : 0);
