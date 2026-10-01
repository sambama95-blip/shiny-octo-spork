/**
 * Field Map — map HCM extract shapes → UKG Pro Launch People Profiles
 * Hard rule: never invent Work-In / Resident SIT tax codes.
 */
(() => {
  "use strict";

  /** @type {readonly string[]} */
  const LAUNCH_HEADERS = Object.freeze([
    "Source Company Code",
    "Source Employee Number",
    "UP Company Code",
    "UP Employee Number",
    "Last Name",
    "First Name",
    "Social Security Number",
    "Date of Birth",
    "Gender",
    "Marital Status",
    "Ethnic ID Code",
    "Employee Type Code",
    "Full or Part Time (F/P)",
    "Earnings Group Code",
    "Deduction Group Code",
    "Pay Group Code",
    "Job Code",
    "Salary or Hourly",
    "Autopay",
    "Scheduled Work Hours per Pay Period",
    "Annual Salary",
    "Hourly Pay Rate",
    "Org Level 1 Code",
    "Location Code",
    "Country",
    "Address Line 1",
    "City/Parish",
    "State/Province",
    "ZIP Code",
    "Federal Filing Status",
    "Federal Exemptions",
    "Work-In SIT Code",
    "Work-In SIT Filing Status",
    "Work In SIT Exemptions",
    "Resident SIT Code",
    "Resident SIT Filing Status",
    "Resident SIT Exemptions",
    "Work Email Address",
  ]);

  /** Targets that require a mapped source column for a clean conversion. */
  const KEY_TARGETS = new Set([
    "Source Company Code",
    "Source Employee Number",
    "Last Name",
    "First Name",
  ]);

  /** SIT targets — codes only when source provides a state; never invented. */
  const WORK_IN_SIT = "Work-In SIT Code";
  const RESIDENT_SIT = "Resident SIT Code";
  const SIT_CODE_TARGETS = new Set([WORK_IN_SIT, RESIDENT_SIT]);

  /**
   * Alias tables: Launch target → ordered source header candidates (normalized match).
   * Named as extract shapes (files), not live APIs.
   */
  const ALIASES = {
    sap: {
      "Source Company Code": ["Company Code", "BUKRS", "Company", "Co Code"],
      "Source Employee Number": ["Personnel Number", "PERNR", "Employee Number", "Emp ID"],
      "UP Company Code": ["UP Company Code", "Target Company Code"],
      "UP Employee Number": ["UP Employee Number", "Target Employee Number"],
      "Last Name": ["Last Name", "NACHN", "Surname"],
      "First Name": ["First Name", "VORNA", "Given Name"],
      "Social Security Number": ["Social Security Number", "SSN", "PERID", "National ID"],
      "Date of Birth": ["Date of Birth", "Birth Date", "GBDAT", "DOB"],
      "Gender": ["Gender", "GESCH", "Sex"],
      "Marital Status": ["Marital Status", "FAMST"],
      "Ethnic ID Code": ["Ethnic ID Code", "Ethnicity", "RACKY"],
      "Employee Type Code": ["Employee Type Code", "Employee Type", "PERSG"],
      "Full or Part Time (F/P)": ["Full or Part Time", "Full/Part Time", "EMPCT", "F/P"],
      "Earnings Group Code": ["Earnings Group Code", "Earnings Group"],
      "Deduction Group Code": ["Deduction Group Code", "Deduction Group"],
      "Pay Group Code": ["Pay Group Code", "Pay Group", "ABKRS", "Payroll Area"],
      "Job Code": ["Job Code", "STELL", "Position", "Plans"],
      "Salary or Hourly": ["Salary or Hourly", "Pay Type", "TRFAR"],
      "Autopay": ["Autopay"],
      "Scheduled Work Hours per Pay Period": ["Scheduled Work Hours", "Hours per Pay Period", "Work Hours"],
      "Annual Salary": ["Annual Salary", "ANSAL", "Yearly Salary"],
      "Hourly Pay Rate": ["Hourly Pay Rate", "Hourly Rate", "BETRG", "Rate"],
      "Org Level 1 Code": ["Org Level 1 Code", "Org Unit", "ORGEH", "Cost Center"],
      "Location Code": ["Location Code", "Personnel Subarea", "BTRTL", "Location"],
      "Country": ["Country", "LAND1", "Country Code"],
      "Address Line 1": ["Address Line 1", "Street", "STRAS", "Address"],
      "City/Parish": ["City/Parish", "City", "ORT01"],
      "State/Province": ["State/Province", "State", "STATE", "REGIO"],
      "ZIP Code": ["ZIP Code", "Postal Code", "PSTLZ", "Zip"],
      "Federal Filing Status": ["Federal Filing Status", "Fed Filing Status"],
      "Federal Exemptions": ["Federal Exemptions", "Fed Exemptions"],
      "Work-In SIT Code": ["Work-In SIT Code", "Worked In State", "Work State", "Personnel Area", "WERKS", "Work Location State"],
      "Work-In SIT Filing Status": ["Work-In SIT Filing Status", "Work State Filing Status"],
      "Work In SIT Exemptions": ["Work In SIT Exemptions", "Work State Exemptions"],
      "Resident SIT Code": ["Resident SIT Code", "Lived In State", "Home State", "Resident State", "Residence State"],
      "Resident SIT Filing Status": ["Resident SIT Filing Status", "Home State Filing Status"],
      "Resident SIT Exemptions": ["Resident SIT Exemptions", "Home State Exemptions"],
      "Work Email Address": ["Work Email Address", "Email", "USRID_LONG", "E-Mail"],
    },
    adp: {
      "Source Company Code": ["Company Code", "Co Code", "Company"],
      "Source Employee Number": ["File #", "File Number", "Assoc ID", "Associate ID", "Employee ID"],
      "UP Company Code": ["UP Company Code"],
      "UP Employee Number": ["UP Employee Number"],
      "Last Name": ["Last Name", "Last"],
      "First Name": ["First Name", "First"],
      "Social Security Number": ["SSN", "Social Security Number", "Tax ID"],
      "Date of Birth": ["Birth Date", "Date of Birth", "DOB"],
      "Gender": ["Gender", "Sex"],
      "Marital Status": ["Marital Status"],
      "Ethnic ID Code": ["Ethnic ID Code", "Ethnicity", "Race"],
      "Employee Type Code": ["Employee Type Code", "Employee Type", "Worker Category"],
      "Full or Part Time (F/P)": ["Full or Part Time", "Full/Part", "F/P", "Status"],
      "Earnings Group Code": ["Earnings Group Code", "Earnings Group"],
      "Deduction Group Code": ["Deduction Group Code", "Deduction Group"],
      "Pay Group Code": ["Pay Group", "Pay Group Code", "Pay Frequency"],
      "Job Code": ["Job Code", "Job Title Code", "Position ID"],
      "Salary or Hourly": ["Salary or Hourly", "Pay Type", "Rate Type"],
      "Autopay": ["Autopay"],
      "Scheduled Work Hours per Pay Period": ["Scheduled Hours", "Standard Hours", "Hours per Pay Period"],
      "Annual Salary": ["Annual Salary", "Salary"],
      "Hourly Pay Rate": ["Rate", "Hourly Rate", "Hourly Pay Rate", "Pay Rate"],
      "Org Level 1 Code": ["Org Level 1 Code", "Department", "Home Department", "Cost Number"],
      "Location Code": ["Location Code", "Location", "Work Location"],
      "Country": ["Country", "Country Code"],
      "Address Line 1": ["Address Line 1", "Address 1", "Street Address", "Address"],
      "City/Parish": ["City", "City/Parish"],
      "State/Province": ["State", "State/Province", "Home State"],
      "ZIP Code": ["ZIP", "ZIP Code", "Zip Code", "Postal Code"],
      "Federal Filing Status": ["Federal Filing Status", "Fed Filing Status", "Federal Marital Status"],
      "Federal Exemptions": ["Federal Exemptions", "Fed Exemptions", "Federal Allowances"],
      "Work-In SIT Code": ["Worked In State", "Work State", "Work-In SIT Code", "Work Location State"],
      "Work-In SIT Filing Status": ["Work-In SIT Filing Status", "Work State Filing Status"],
      "Work In SIT Exemptions": ["Work In SIT Exemptions", "Work State Exemptions"],
      "Resident SIT Code": ["Lived In State", "Home State", "Resident State", "Resident SIT Code"],
      "Resident SIT Filing Status": ["Resident SIT Filing Status", "Home State Filing Status"],
      "Resident SIT Exemptions": ["Resident SIT Exemptions", "Home State Exemptions"],
      "Work Email Address": ["Work Email", "Work Email Address", "Email", "Business Email"],
    },
    ukg: {
      "Source Company Code": ["Source Company Code", "Company Code"],
      "Source Employee Number": ["Source Employee Number", "Employee Number", "Emp No"],
      "UP Company Code": ["UP Company Code"],
      "UP Employee Number": ["UP Employee Number"],
      "Last Name": ["Last Name"],
      "First Name": ["First Name"],
      "Social Security Number": ["Social Security Number", "SSN"],
      "Date of Birth": ["Date of Birth", "Birth Date"],
      "Gender": ["Gender"],
      "Marital Status": ["Marital Status"],
      "Ethnic ID Code": ["Ethnic ID Code"],
      "Employee Type Code": ["Employee Type Code"],
      "Full or Part Time (F/P)": ["Full or Part Time (F/P)", "Full or Part Time"],
      "Earnings Group Code": ["Earnings Group Code"],
      "Deduction Group Code": ["Deduction Group Code"],
      "Pay Group Code": ["Pay Group Code"],
      "Job Code": ["Job Code"],
      "Salary or Hourly": ["Salary or Hourly"],
      "Autopay": ["Autopay"],
      "Scheduled Work Hours per Pay Period": ["Scheduled Work Hours per Pay Period", "Scheduled Work Hours"],
      "Annual Salary": ["Annual Salary"],
      "Hourly Pay Rate": ["Hourly Pay Rate"],
      "Org Level 1 Code": ["Org Level 1 Code"],
      "Location Code": ["Location Code"],
      "Country": ["Country"],
      "Address Line 1": ["Address Line 1"],
      "City/Parish": ["City/Parish", "City"],
      "State/Province": ["State/Province", "State"],
      "ZIP Code": ["ZIP Code"],
      "Federal Filing Status": ["Federal Filing Status"],
      "Federal Exemptions": ["Federal Exemptions"],
      "Work-In SIT Code": ["Work-In SIT Code", "Worked In State", "Work State"],
      "Work-In SIT Filing Status": ["Work-In SIT Filing Status"],
      "Work In SIT Exemptions": ["Work In SIT Exemptions"],
      "Resident SIT Code": ["Resident SIT Code", "Lived In State", "Home State"],
      "Resident SIT Filing Status": ["Resident SIT Filing Status"],
      "Resident SIT Exemptions": ["Resident SIT Exemptions"],
      "Work Email Address": ["Work Email Address", "Email"],
    },
    other: {
      "Source Company Code": ["Company Code", "Company", "Co Code", "Employer Code"],
      "Source Employee Number": ["Employee ID", "Emp ID", "Employee Number", "EE ID", "ID"],
      "UP Company Code": ["UP Company Code"],
      "UP Employee Number": ["UP Employee Number"],
      "Last Name": ["Last Name", "Last", "Surname"],
      "First Name": ["First Name", "First", "Given Name"],
      "Social Security Number": ["SSN", "Social Security Number", "National ID"],
      "Date of Birth": ["Date of Birth", "Birth Date", "DOB"],
      "Gender": ["Gender"],
      "Marital Status": ["Marital Status"],
      "Ethnic ID Code": ["Ethnic ID Code", "Ethnicity"],
      "Employee Type Code": ["Employee Type Code", "Employee Type"],
      "Full or Part Time (F/P)": ["Full or Part Time", "F/P", "Full/Part Time"],
      "Earnings Group Code": ["Earnings Group Code", "Earnings Group"],
      "Deduction Group Code": ["Deduction Group Code", "Deduction Group"],
      "Pay Group Code": ["Pay Group", "Pay Group Code"],
      "Job Code": ["Job Code", "Job"],
      "Salary or Hourly": ["Salary or Hourly", "Pay Type"],
      "Autopay": ["Autopay"],
      "Scheduled Work Hours per Pay Period": ["Scheduled Hours", "Hours per Pay Period", "Hours"],
      "Annual Salary": ["Annual Salary", "Salary"],
      "Hourly Pay Rate": ["Hourly Rate", "Hourly Pay Rate", "Rate"],
      "Org Level 1 Code": ["Org Level 1 Code", "Department", "Dept"],
      "Location Code": ["Location Code", "Location"],
      "Country": ["Country"],
      "Address Line 1": ["Address Line 1", "Address", "Street"],
      "City/Parish": ["City", "City/Parish"],
      "State/Province": ["State", "State/Province"],
      "ZIP Code": ["ZIP", "ZIP Code", "Postal Code"],
      "Federal Filing Status": ["Federal Filing Status", "Fed Status"],
      "Federal Exemptions": ["Federal Exemptions", "Fed Exemptions"],
      "Work-In SIT Code": ["Work State", "Worked In State", "Work-In SIT Code"],
      "Work-In SIT Filing Status": ["Work-In SIT Filing Status"],
      "Work In SIT Exemptions": ["Work In SIT Exemptions"],
      "Resident SIT Code": ["Home State", "Lived In State", "Resident State", "Resident SIT Code"],
      "Resident SIT Filing Status": ["Resident SIT Filing Status"],
      "Resident SIT Exemptions": ["Resident SIT Exemptions"],
      "Work Email Address": ["Work Email Address", "Email", "Work Email"],
    },
  };

  /** Embedded demos (also mirrored under demos/) so Load demo works offline. */
  const DEMOS = {
    sap: `Personnel Number,Last Name,First Name,Birth Date,Company Code,Personnel Area,Personnel Subarea,Pay Scale Type,Job Code,Pay Group,Annual Salary,Hourly Rate,Street,City,State,Postal Code,Country,Email,Lived In State,Gender,Marital Status,Full/Part Time,Federal Filing Status,Federal Exemptions
1002341,Nguyen,Mai,1988-04-12,1000,TX,HOU1,H,ENG-04,BW,92000,,1200 Main St,Houston,TX,77002,US,mai.nguyen@example.com,TX,F,M,F,M,2
1002342,Patel,Ravi,1991-09-03,1000,CA,SFO1,H,ANL-02,BW,,48.50,88 Market St,San Francisco,CA,94105,US,ravi.patel@example.com,CA,M,S,F,S,1
1002343,Brooks,Elena,1985-01-22,1000,,ATL1,S,MGR-01,SM,115000,,,,,,US,elena.brooks@example.com,,F,M,F,M,3
`,
    adp: `Company Code,File #,Assoc ID,Last Name,First Name,SSN,Birth Date,Rate,Annual Salary,Job Code,Pay Group,Worked In State,Lived In State,Address 1,City,State,ZIP,Country,Work Email,Gender,Marital Status,Full/Part,Federal Filing Status,Federal Exemptions,Pay Type,Department
ACME,000145,A145,Chen,Laura,***-**-4412,1990-06-18,52.00,,OPS-12,WK,NY,NY,40 Broad St,New York,NY,10004,US,laura.chen@example.com,F,S,F,S,1,H,Operations
ACME,000146,A146,Williams,Jordan,***-**-8821,1987-11-02,,78000,FIN-03,BW,NJ,NJ,1 Gateway Ctr,Newark,NJ,07102,US,jordan.williams@example.com,M,M,F,M,2,S,Finance
ACME,000147,A147,Okoye,Ada,***-**-1190,1993-03-29,41.25,,CS-07,WK,,,500 Peachtree,Atlanta,GA,30308,US,ada.okoye@example.com,F,S,P,S,0,H,Support
`,
    ukg: `Source Company Code,Source Employee Number,UP Company Code,UP Employee Number,Last Name,First Name,Social Security Number,Date of Birth,Gender,Marital Status,Ethnic ID Code,Employee Type Code,Full or Part Time (F/P),Earnings Group Code,Deduction Group Code,Pay Group Code,Job Code,Salary or Hourly,Autopay,Scheduled Work Hours per Pay Period,Annual Salary,Hourly Pay Rate,Org Level 1 Code,Location Code,Country,Address Line 1,City/Parish,State/Province,ZIP Code,Federal Filing Status,Federal Exemptions,Work-In SIT Code,Work-In SIT Filing Status,Work In SIT Exemptions,Resident SIT Code,Resident SIT Filing Status,Resident SIT Exemptions,Work Email Address
U100,E9001,U100,E9001,Garcia,Sofia,***-**-2201,1989-07-14,F,M,,R,F,EG1,DG1,BIWK,HR-01,S,Y,80,86000,,ORG1,LOC-AUS,US,200 Congress Ave,Austin,TX,78701,M,2,TX,S,1,TX,S,1,sofia.garcia@example.com
U100,E9002,U100,E9002,Kim,Daniel,***-**-3308,1992-12-01,M,S,,R,F,EG1,DG1,BIWK,IT-05,H,Y,80,,55.00,ORG2,LOC-SEA,US,1201 3rd Ave,Seattle,WA,98101,S,1,WA,S,0,WA,S,0,daniel.kim@example.com
U100,E9003,U100,E9003,Hassan,Noor,***-**-7744,1986-05-09,F,M,,R,P,EG2,DG1,WKLY,OPS-02,H,Y,40,,32.00,ORG1,LOC-CHI,US,233 S Wacker,Chicago,IL,60606,M,3,,,IL,M,2,noor.hassan@example.com
`,
    other: `Company Code,Employee ID,First Name,Last Name,SSN,Birth Date,Work State,Home State,Hourly Rate,Annual Salary,Job Code,Pay Group,Address,City,State,ZIP,Country,Email,Gender,F/P,Federal Filing Status,Federal Exemptions,Pay Type,Department
SHOP1,EE-201,Chris,Morales,***-**-5502,1994-08-21,FL,FL,28.75,,CLK-01,WK,900 Ocean Dr,Miami,FL,33139,US,chris.morales@example.com,M,F,S,1,H,Store
SHOP1,EE-202,Priya,Singh,***-**-6611,1988-02-11,GA,GA,,64000,ADM-03,BW,100 Peachtree St,Atlanta,GA,30303,US,priya.singh@example.com,F,F,M,2,S,Admin
SHOP1,EE-203,Marcus,Lee,***-**-9022,1990-10-05,,,36.00,,TECH-02,WK,12 River Rd,Portland,OR,97201,US,marcus.lee@example.com,M,F,S,0,H,Tech
`,
  };

  const DEMO_PATHS = {
    sap: "demos/sap-flat-export.csv",
    adp: "demos/adp-workforce-extract.csv",
    ukg: "demos/ukg-near-passthrough.csv",
    other: "demos/smaller-shop-extract.csv",
  };

  /** @type {{ source: string, headers: string[], rows: Record<string,string>[], mapping: Record<string,string>, fileName: string }} */
  const state = {
    source: "sap",
    headers: [],
    rows: [],
    mapping: {},
    fileName: "",
  };

  const el = {
    sourceOpts: () => [...document.querySelectorAll(".source-opt")],
    steps: () => [...document.querySelectorAll(".step")],
    dropzone: document.getElementById("dropzone"),
    browseBtn: document.getElementById("browse-btn"),
    fileInput: document.getElementById("file-input"),
    demoBtn: document.getElementById("demo-btn"),
    fileChip: document.getElementById("file-chip"),
    stepMap: document.getElementById("step-map"),
    stepDownload: document.getElementById("download"),
    mapBody: document.getElementById("map-body"),
    mapStats: document.getElementById("map-stats"),
    previewNote: document.getElementById("preview-note"),
    downloadStats: document.getElementById("download-stats"),
    exceptionList: document.getElementById("exception-list"),
    dlMap: document.getElementById("dl-map"),
    dlPeople: document.getElementById("dl-people"),
    dlExceptions: document.getElementById("dl-exceptions"),
  };

  function normalizeHeader(h) {
    return String(h || "")
      .trim()
      .replace(/^\uFEFF/, "")
      .toLowerCase()
      .replace(/[\s_\-./()]+/g, " ")
      .trim();
  }

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
        } else if (c === '"') {
          inQuotes = false;
        } else {
          cell += c;
        }
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(cell);
        cell = "";
      } else if (c === "\n") {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      } else if (c === "\r") {
        // ignore; handle \r\n via \n
      } else {
        cell += c;
      }
    }
    if (cell.length || row.length) {
      row.push(cell);
      rows.push(row);
    }

    while (rows.length && rows[rows.length - 1].every((x) => String(x).trim() === "")) {
      rows.pop();
    }
    if (!rows.length) return { headers: [], records: [] };

    const headers = rows[0].map((h) => String(h).trim());
    const records = rows.slice(1).map((r) => {
      /** @type {Record<string,string>} */
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = r[idx] != null ? String(r[idx]).trim() : "";
      });
      return obj;
    });
    return { headers, records };
  }

  function escapeCsv(value) {
    const s = value == null ? "" : String(value);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }

  function toCsv(headers, records) {
    const lines = [headers.map(escapeCsv).join(",")];
    for (const rec of records) {
      lines.push(headers.map((h) => escapeCsv(rec[h] ?? "")).join(","));
    }
    return lines.join("\r\n") + "\r\n";
  }

  function downloadBlob(filename, text) {
    const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function findAliasMatch(target, sourceHeaders, sourceKey) {
    const aliases = ALIASES[sourceKey]?.[target] || [];
    const normalized = new Map(sourceHeaders.map((h) => [normalizeHeader(h), h]));

    // Exact Launch header passthrough first
    if (normalized.has(normalizeHeader(target))) {
      return normalized.get(normalizeHeader(target));
    }
    for (const alias of aliases) {
      const hit = normalized.get(normalizeHeader(alias));
      if (hit) return hit;
    }
    return "";
  }

  function buildAutoMapping(sourceKey, sourceHeaders) {
    /** @type {Record<string,string>} */
    const mapping = {};
    for (const target of LAUNCH_HEADERS) {
      mapping[target] = findAliasMatch(target, sourceHeaders, sourceKey);
    }
    return mapping;
  }

  /**
   * Resolve Work-In / Resident SIT code from a mapped source cell.
   * Accept only plausible state/province tokens already present in source.
   * Never invent jurisdiction codes.
   */
  function resolveSitCode(raw) {
    const v = String(raw || "").trim();
    if (!v) return "";
    // Allow US state/province style codes already in the extract (2–5 alnum), or full names as-is.
    // We pass through source values; we do not look up or invent tax table codes.
    return v;
  }

  function mappedValue(row, target) {
    const srcCol = state.mapping[target] || "";
    if (!srcCol) return "";
    const raw = row[srcCol] ?? "";
    if (SIT_CODE_TARGETS.has(target)) {
      return resolveSitCode(raw);
    }
    return raw;
  }

  function rowIdentity(row, index) {
    const co = mappedValue(row, "Source Company Code") || "?";
    const emp = mappedValue(row, "Source Employee Number") || `row-${index + 1}`;
    return `${co}|${emp}`;
  }

  /**
   * Build Launch people rows + exceptions.
   * Missing Work-In or Resident SIT → BLOCKED (not invented).
   */
  function convertRows() {
    const people = [];
    const exceptions = [];

    state.rows.forEach((row, index) => {
      /** @type {Record<string,string>} */
      const out = {};
      for (const h of LAUNCH_HEADERS) {
        out[h] = mappedValue(row, h);
      }

      // Mirror address state into State/Province if mapped separately
      const workSit = out[WORK_IN_SIT];
      const resSit = out[RESIDENT_SIT];
      const id = rowIdentity(row, index);
      const name = `${out["Last Name"] || ""}, ${out["First Name"] || ""}`.replace(/^, |, $/g, "") || "(unnamed)";

      const blockers = [];
      if (!workSit) {
        blockers.push("Missing Work-In SIT Code (no work/resident work-state in source; code not invented)");
      }
      if (!resSit) {
        blockers.push("Missing Resident SIT Code (no home/lived-in state in source; code not invented)");
      }

      if (blockers.length) {
        for (const reason of blockers) {
          exceptions.push({
            "Source Company Code": out["Source Company Code"],
            "Source Employee Number": out["Source Employee Number"],
            "UP Company Code": out["UP Company Code"],
            "UP Employee Number": out["UP Employee Number"],
            "Employee Name": name,
            Status: "BLOCKED",
            Field: reason.includes("Work-In") ? WORK_IN_SIT : RESIDENT_SIT,
            Reason: reason,
            "Row Index": String(index + 1),
            Key: id,
          });
        }
      }

      // Always include the Launch row; blocked status is tracked in exceptions.
      // Implementers still see the partial profile; SIT codes remain blank.
      people.push(out);
    });

    return { people, exceptions };
  }

  function setStep(n) {
    el.steps().forEach((node) => {
      const s = Number(node.dataset.step);
      node.classList.toggle("is-active", s === n);
      node.classList.toggle("is-done", s < n);
    });
  }

  function updateSourceUI() {
    el.sourceOpts().forEach((btn) => {
      const selected = btn.dataset.source === state.source;
      btn.classList.toggle("is-selected", selected);
      btn.setAttribute("aria-pressed", selected ? "true" : "false");
    });
  }

  function renderMap() {
    const body = el.mapBody;
    body.innerHTML = "";
    const options = ['<option value="">— unmapped —</option>']
      .concat(state.headers.map((h) => `<option value="${escapeAttr(h)}">${escapeHtml(h)}</option>`))
      .join("");

    let mappedCount = 0;
    for (const target of LAUNCH_HEADERS) {
      const src = state.mapping[target] || "";
      if (src) mappedCount++;
      const tr = document.createElement("tr");
      let statusClass = "unmapped";
      let statusText = "Unmapped";
      if (src) {
        statusClass = "mapped";
        statusText = "Mapped";
      } else if (KEY_TARGETS.has(target) || SIT_CODE_TARGETS.has(target)) {
        statusClass = "required";
        statusText = SIT_CODE_TARGETS.has(target) ? "Required (no invent)" : "Key";
      }

      tr.innerHTML = `
        <td class="target">${escapeHtml(target)}</td>
        <td>
          <select class="map-select ${src ? "" : "unmapped"}" data-target="${escapeAttr(target)}" aria-label="Map ${escapeAttr(target)}">
            ${options}
          </select>
        </td>
        <td><span class="status ${statusClass}">${statusText}</span></td>
      `;
      const select = tr.querySelector("select");
      select.value = src;
      select.addEventListener("change", () => {
        state.mapping[target] = select.value;
        renderMap();
        renderDownloads();
      });
      body.appendChild(tr);
    }

    el.mapStats.innerHTML = `
      <span><b>${mappedCount}</b> / ${LAUNCH_HEADERS.length} targets mapped</span>
      <span><b>${state.rows.length}</b> source rows</span>
      <span>Shape: <b>${sourceLabel(state.source)}</b></span>
    `;
    el.previewNote.textContent = `Keys: Source Company Code + Source Employee Number; UP Company/Employee when mapped. Sample headers: ${state.headers.slice(0, 6).join(", ")}${state.headers.length > 6 ? "…" : ""}`;
  }

  function renderDownloads() {
    const { people, exceptions } = convertRows();
    const blockedKeys = new Set(exceptions.filter((e) => e.Status === "BLOCKED").map((e) => e.Key));
    el.downloadStats.innerHTML = `
      <span><b>${people.length}</b> People Profiles rows</span>
      <span class="blocked"><b>${blockedKeys.size}</b> employees BLOCKED</span>
      <span><b>${exceptions.length}</b> exception lines</span>
    `;

    const list = el.exceptionList;
    list.innerHTML = "";
    const shown = exceptions.slice(0, 12);
    if (!shown.length) {
      list.innerHTML = "<li>No exceptions — Work-In and Resident SIT present for all rows.</li>";
    } else {
      for (const ex of shown) {
        const li = document.createElement("li");
        li.innerHTML = `<span class="tag">${escapeHtml(ex.Status)}</span> ${escapeHtml(ex["Employee Name"] || ex.Key)} — ${escapeHtml(ex.Reason)}`;
        list.appendChild(li);
      }
      if (exceptions.length > shown.length) {
        const more = document.createElement("li");
        more.textContent = `…and ${exceptions.length - shown.length} more in exceptions.csv`;
        list.appendChild(more);
      }
    }
  }

  function sourceLabel(key) {
    switch (key) {
      case "sap":
        return "SAP flat export";
      case "adp":
        return "ADP extract";
      case "ukg":
        return "UKG extract";
      case "other":
        return "Smaller shop / Other";
      default: {
        const _exhaustive = key;
        return String(_exhaustive);
      }
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, "&#39;");
  }

  function ingest(text, fileName) {
    const { headers, records } = parseCsv(text);
    if (!headers.length) {
      window.alert("Could not parse CSV headers.");
      return;
    }
    state.headers = headers;
    state.rows = records;
    state.fileName = fileName || "upload.csv";
    state.mapping = buildAutoMapping(state.source, headers);

    el.fileChip.textContent = `Loaded ${state.fileName} · ${records.length} rows · ${headers.length} columns`;
    el.fileChip.classList.remove("hidden");
    el.stepMap.classList.remove("hidden");
    el.stepDownload.classList.remove("hidden");
    setStep(3);
    renderMap();
    renderDownloads();
    el.stepMap.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function loadDemo() {
    const key = state.source;
    const path = DEMO_PATHS[key];
    try {
      const res = await fetch(path);
      if (res.ok) {
        const text = await res.text();
        ingest(text, path.split("/").pop());
        setStep(4);
        return;
      }
    } catch {
      // fall through to embedded
    }
    ingest(DEMOS[key], path.split("/").pop());
    setStep(4);
  }

  function fieldMapCsv() {
    const headers = ["Launch Target", "Source Column", "Status"];
    const records = LAUNCH_HEADERS.map((target) => {
      const src = state.mapping[target] || "";
      let status = "UNMAPPED";
      if (src) status = "MAPPED";
      else if (SIT_CODE_TARGETS.has(target)) status = "REQUIRED_NO_INVENT";
      else if (KEY_TARGETS.has(target)) status = "KEY";
      return {
        "Launch Target": target,
        "Source Column": src,
        Status: status,
      };
    });
    return toCsv(headers, records);
  }

  function onSourceSelect(key) {
    state.source = key;
    updateSourceUI();
    setStep(2);
    if (state.rows.length) {
      state.mapping = buildAutoMapping(state.source, state.headers);
      renderMap();
      renderDownloads();
    }
  }

  function wire() {
    el.sourceOpts().forEach((btn) => {
      btn.addEventListener("click", () => onSourceSelect(btn.dataset.source));
    });

    el.browseBtn.addEventListener("click", () => el.fileInput.click());
    el.fileInput.addEventListener("change", () => {
      const file = el.fileInput.files && el.fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => ingest(String(reader.result || ""), file.name);
      reader.readAsText(file);
    });

    const dz = el.dropzone;
    ["dragenter", "dragover"].forEach((evt) => {
      dz.addEventListener(evt, (e) => {
        e.preventDefault();
        dz.classList.add("is-dragover");
      });
    });
    ["dragleave", "drop"].forEach((evt) => {
      dz.addEventListener(evt, (e) => {
        e.preventDefault();
        dz.classList.remove("is-dragover");
      });
    });
    dz.addEventListener("drop", (e) => {
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => ingest(String(reader.result || ""), file.name);
      reader.readAsText(file);
    });

    el.demoBtn.addEventListener("click", () => {
      setStep(2);
      loadDemo();
    });

    el.dlMap.addEventListener("click", () => {
      if (!state.rows.length) return;
      downloadBlob("field_map.csv", fieldMapCsv());
    });
    el.dlPeople.addEventListener("click", () => {
      if (!state.rows.length) return;
      const { people } = convertRows();
      downloadBlob("01_People_Profiles.csv", toCsv(LAUNCH_HEADERS, people));
    });
    el.dlExceptions.addEventListener("click", () => {
      if (!state.rows.length) return;
      const { exceptions } = convertRows();
      const headers = [
        "Source Company Code",
        "Source Employee Number",
        "UP Company Code",
        "UP Employee Number",
        "Employee Name",
        "Status",
        "Field",
        "Reason",
        "Row Index",
        "Key",
      ];
      downloadBlob("exceptions.csv", toCsv(headers, exceptions));
    });
  }

  wire();
  updateSourceUI();
  setStep(1);
})();
