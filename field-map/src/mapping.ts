import type { DemoPack, FieldDef, FieldMapping, Profile, ProfileId } from './types'
import templatesJson from './data/templates.json'
import demosJson from './data/demos.json'

export const profiles = templatesJson as Profile[]
export const demos = demosJson as DemoPack[]

export function getProfile(id: ProfileId): Profile {
  const profile = profiles.find((p) => p.id === id)
  if (!profile) throw new Error(`Missing profile definition for ${id}`)
  return profile
}

export function getDemo(id: ProfileId): DemoPack {
  const demo = demos.find((d) => d.id === id)
  if (!demo) throw new Error(`Missing demo pack for ${id}`)
  return demo
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

const aliases: Record<string, string[]> = {
  PERNR: ['pernr', 'personnel number', 'employee id', 'emp id', 'empid', 'person id'],
  BUKRS: ['bukrs', 'company code', 'company', 'co code'],
  WERKS: ['werks', 'personnel area', 'plant', 'location'],
  BEGDA: ['begda', 'begin date', 'start date', 'from date', 'pay date'],
  ENDDA: ['endda', 'end date', 'to date'],
  LGART: ['lgart', 'wage type', 'pay code', 'earn code', 'earnings code'],
  BETRG: ['betrg', 'amount', 'earnings amount', 'gross', 'pay amount'],
  ANZHL: ['anzhl', 'hours', 'number', 'qty', 'quantity'],
  WAERS: ['waers', 'currency', 'curr'],
  TAX_CODE: ['tax code', 'tax_code', 'taxcode', 'tax setup'],
  FileNumber: ['file number', 'filenumber', 'file #', 'employee id', 'emp id'],
  AssociateID: ['associate id', 'associateid', 'person id'],
  PayDate: ['pay date', 'paydate', 'check date', 'payment date'],
  EarningsCode: ['earnings code', 'earn code', 'pay code', 'wage type'],
  Hours: ['hours', 'hrs', 'regular hours'],
  Rate: ['rate', 'hourly rate', 'pay rate'],
  EarningsAmount: ['earnings amount', 'amount', 'gross', 'pay amount'],
  DeductionCode: ['deduction code', 'ded code', 'deduction'],
  DeductionAmount: ['deduction amount', 'ded amount'],
  Department: ['department', 'dept', 'cost center'],
  TaxJurisdiction: ['tax jurisdiction', 'tax juris', 'jurisdiction'],
  EmployeeNumber: ['employee number', 'emp number', 'employee id', 'empid'],
  PersonID: ['person id', 'personid', 'associate id'],
  PayPeriodEnd: ['pay period end', 'period end', 'ppe', 'end date'],
  PayCode: ['pay code', 'paycode', 'earn code', 'wage type'],
  Amount: ['amount', 'pay amount', 'gross', 'earnings amount'],
  OrgLevel1: ['org level 1', 'org1', 'department', 'dept'],
  OrgLevel2: ['org level 2', 'org2', 'location', 'cost center'],
  JobCode: ['job code', 'jobcode', 'job'],
  TaxCode: ['tax code', 'taxcode', 'tax setup'],
  employee_id: ['employee id', 'empid', 'emp id', 'file number', 'personnel number'],
  employee_name: ['employee name', 'name', 'full name', 'worker name'],
  pay_date: ['pay date', 'check date', 'payment date'],
  earn_code: ['earn code', 'earnings code', 'pay code', 'wage type'],
  hours: ['hours', 'hrs'],
  gross_pay: ['gross pay', 'gross', 'amount', 'earnings amount'],
  dept: ['dept', 'department'],
  location: ['location', 'site', 'werks'],
  tax_setup: ['tax setup', 'tax code', 'tax_setup'],
  notes: ['notes', 'comment', 'comments', 'memo'],
}

function scoreMatch(targetKey: string, sourceColumn: string): number {
  const source = normalize(sourceColumn)
  const target = normalize(targetKey)
  if (!source) return 0
  if (source === target) return 100
  if (source.includes(target) || target.includes(source)) return 80
  for (const alias of aliases[targetKey] ?? []) {
    const a = normalize(alias)
    if (source === a) return 95
    if (source.includes(a) || a.includes(source)) return 70
  }
  return 0
}

function bestColumn(field: FieldDef, columns: string[]): string | null {
  let best: string | null = null
  let bestScore = 0
  for (const column of columns) {
    const score = scoreMatch(field.key, column)
    if (score > bestScore) {
      bestScore = score
      best = column
    }
  }
  return bestScore >= 60 ? best : null
}

export function autoMap(profile: Profile, columns: string[]): FieldMapping[] {
  const used = new Set<string>()
  return profile.fields.map((field) => {
    let column = bestColumn(field, columns)
    if (column && used.has(column)) {
      column =
        columns.find(
          (candidate) =>
            candidate !== column &&
            scoreMatch(field.key, candidate) >= 60 &&
            !used.has(candidate),
        ) ?? column
    }
    if (column) used.add(column)
    return { targetKey: field.key, sourceColumn: column }
  })
}

export function applyMappings(
  rows: Record<string, string>[],
  mappings: FieldMapping[],
  profile: Profile,
): Record<string, string>[] {
  return rows.map((row) => {
    const out: Record<string, string> = {}
    for (const field of profile.fields) {
      const source = mappings.find((m) => m.targetKey === field.key)?.sourceColumn
      out[field.key] = source ? (row[source] ?? '') : ''
    }
    return out
  })
}

export function missingRequired(
  mappings: FieldMapping[],
  profile: Profile,
): string[] {
  return profile.fields
    .filter((field) => field.required)
    .filter(
      (field) => !mappings.find((m) => m.targetKey === field.key)?.sourceColumn,
    )
    .map((field) => field.label)
}

export function toCsv(rows: Record<string, string>[], columns: string[]): string {
  const escape = (value: string) =>
    /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
  const lines = [columns.map(escape).join(',')]
  for (const row of rows) {
    lines.push(columns.map((column) => escape(row[column] ?? '')).join(','))
  }
  return `${lines.join('\n')}\n`
}

export function downloadText(filename: string, contents: string): void {
  const blob = new Blob([contents], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
