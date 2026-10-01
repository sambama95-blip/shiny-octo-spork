import Papa from 'papaparse'
import { useEffect, useMemo, useRef, useState } from 'react'
import { softGateStorageKey } from './access-config'
import {
  applyMappings,
  autoMap,
  demos,
  downloadText,
  getDemo,
  getProfile,
  missingRequired,
  profiles,
  toCsv,
} from './mapping'
import { SoftGate } from './SoftGate'
import type { FieldMapping, ProfileId, SourceState } from './types'
import './App.css'

function isUnlocked(): boolean {
  try {
    return sessionStorage.getItem(softGateStorageKey) === '1'
  } catch {
    return false
  }
}

function setUnlocked(): void {
  try {
    sessionStorage.setItem(softGateStorageKey, '1')
  } catch {
    /* ignore */
  }
}

function clearUnlocked(): void {
  try {
    sessionStorage.removeItem(softGateStorageKey)
  } catch {
    /* ignore */
  }
}

function parseCsv(
  text: string,
  filename: string,
  note?: string,
): SourceState {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  })

  if (result.errors.length > 0 && (!result.data || result.data.length === 0)) {
    return {
      status: 'error',
      message: result.errors[0]?.message ?? 'Could not parse CSV',
    }
  }

  const columns =
    result.meta.fields?.filter((field) => field && field.trim().length > 0) ??
    []

  if (columns.length === 0) {
    return { status: 'error', message: 'No header columns found in the CSV.' }
  }

  return {
    status: 'ready',
    filename,
    columns,
    rows: result.data.map((row) => {
      const normalized: Record<string, string> = {}
      for (const column of columns) {
        normalized[column] = row[column] == null ? '' : String(row[column]).trim()
      }
      return normalized
    }),
    note,
  }
}

export default function App() {
  const [unlocked, setUnlockedState] = useState(false)
  const [profileId, setProfileId] = useState<ProfileId>('sap')
  const [source, setSource] = useState<SourceState>({ status: 'idle' })
  const [mappings, setMappings] = useState<FieldMapping[]>([])
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setUnlockedState(isUnlocked())
  }, [])

  const profile = useMemo(() => getProfile(profileId), [profileId])

  useEffect(() => {
    if (source.status === 'ready') {
      setMappings(autoMap(profile, source.columns))
    }
  }, [profile, source])

  function unlock() {
    setUnlocked()
    setUnlockedState(true)
  }

  function lock() {
    clearUnlocked()
    setUnlockedState(false)
  }

  function readFile(file: File) {
    setSource({ status: 'loading' })
    const reader = new FileReader()
    reader.onload = () => {
      setSource(parseCsv(String(reader.result ?? ''), file.name))
    }
    reader.onerror = () => {
      setSource({ status: 'error', message: 'Failed to read that file.' })
    }
    reader.readAsText(file)
  }

  function loadDemo(id: ProfileId) {
    const demo = getDemo(id)
    setProfileId(id)
    setSource(parseCsv(demo.csv, demo.filename, demo.note))
  }

  function updateMapping(targetKey: string, sourceColumn: string) {
    setMappings((current) =>
      current.map((mapping) =>
        mapping.targetKey === targetKey
          ? {
              ...mapping,
              sourceColumn: sourceColumn === '' ? null : sourceColumn,
            }
          : mapping,
      ),
    )
  }

  const unmappedRequired = useMemo(
    () => (source.status === 'ready' ? missingRequired(mappings, profile) : []),
    [mappings, source, profile],
  )

  const previewRows = useMemo(
    () =>
      source.status === 'ready'
        ? applyMappings(source.rows.slice(0, 5), mappings, profile)
        : [],
    [source, mappings, profile],
  )

  function download() {
    if (source.status !== 'ready' || unmappedRequired.length > 0) return
    const rows = applyMappings(source.rows, mappings, profile)
    const csv = toCsv(
      rows,
      profile.fields.map((field) => field.key),
    )
    const base = source.filename.replace(/\.csv$/i, '')
    downloadText(`${base}__${profile.id}-load.csv`, csv)
  }

  if (!unlocked) {
    return <SoftGate onUnlock={unlock} />
  }

  return (
    <div className="app">
      <div className="app__atmosphere" aria-hidden="true" />
      <header className="topbar">
        <div className="topbar__brand">
          <span className="topbar__mark" aria-hidden="true">
            FM
          </span>
          <div>
            <p className="topbar__name">Field Map</p>
            <p className="topbar__tag">Payroll extract → load-ready files</p>
          </div>
        </div>
        <button type="button" className="btn btn--quiet" onClick={lock}>
          Lock preview
        </button>
      </header>

      <main className="main">
        <section className="hero">
          <h1 className="hero__title">
            Files first. Every field visible. <em>Never invent tax or setup codes.</em>
          </h1>
          <p className="hero__lede">
            Drop a payroll extract, map source columns to a load template, and
            download a load-ready CSV. Field Map is a conversion mapper — not a
            live vendor API, not ACH, and not Open Payroll paycheck calculation.
          </p>
        </section>

        <section className="panel" aria-labelledby="target-heading">
          <div className="panel__head">
            <h2 id="target-heading">1 · Choose load target</h2>
            <p>Pick the destination shape. Codes stay pass-through.</p>
          </div>
          <div className="target-grid">
            {profiles.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`target-card ${profileId === item.id ? 'is-active' : ''}`}
                onClick={() => setProfileId(item.id)}
              >
                <span className="target-card__name">{item.name}</span>
                <span className="target-card__blurb">{item.blurb}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="panel" aria-labelledby="source-heading">
          <div className="panel__head">
            <h2 id="source-heading">2 · Source extract</h2>
            <p>Upload a CSV or load a synthetic demo pack.</p>
          </div>
          <div
            className={`dropzone ${dragging ? 'is-over' : ''}`}
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault()
              setDragging(false)
              const file = event.dataTransfer.files?.[0]
              if (file) readFile(file)
            }}
          >
            <p className="dropzone__title">Drop CSV here</p>
            <p className="dropzone__hint">
              Headers become source fields. Nothing leaves this browser.
            </p>
            <div className="dropzone__actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) readFile(file)
                  event.target.value = ''
                }}
              />
            </div>
          </div>
          <div className="demo-row">
            {demos.map((demo) => (
              <button
                key={demo.id}
                type="button"
                className="btn btn--ghost"
                onClick={() => loadDemo(demo.id)}
              >
                {demo.label}
              </button>
            ))}
          </div>
          {source.status === 'loading' ? (
            <p className="status status--muted">Reading file…</p>
          ) : null}
          {source.status === 'error' ? (
            <p className="status status--error" role="alert">
              {source.message}
            </p>
          ) : null}
          {source.status === 'ready' ? (
            <div className="source-meta">
              <p>
                <strong>{source.filename}</strong> — {source.columns.length}{' '}
                columns · {source.rows.length} rows
              </p>
              {source.note ? (
                <p className="source-meta__note">{source.note}</p>
              ) : null}
              <div className="chip-row" aria-label="Source columns">
                {source.columns.map((column) => (
                  <span className="chip" key={column}>
                    {column}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {source.status === 'idle' ? (
            <p className="status status--muted">
              No file yet. Try a demo extract to see the full map flow.
            </p>
          ) : null}
        </section>

        <section className="panel" aria-labelledby="map-heading">
          <div className="panel__head">
            <h2 id="map-heading">3 · Field map</h2>
            <p>
              Every target field is listed. Fields marked never-invent stay empty
              unless the source provides a value.
            </p>
          </div>
          {source.status === 'ready' ? (
            <div className="map-table-wrap">
              <table className="map-table">
                <thead>
                  <tr>
                    <th>Target field</th>
                    <th>Source column</th>
                    <th>Rules</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.fields.map((field) => {
                    const mapping = mappings.find(
                      (item) => item.targetKey === field.key,
                    )
                    return (
                      <tr key={field.key}>
                        <td>
                          <div className="field-label">
                            <code>{field.key}</code>
                            <span>
                              {field.label}
                              {field.required ? (
                                <abbr title="Required"> *</abbr>
                              ) : null}
                            </span>
                          </div>
                        </td>
                        <td>
                          <select
                            className="select"
                            value={mapping?.sourceColumn ?? ''}
                            onChange={(event) =>
                              updateMapping(field.key, event.target.value)
                            }
                          >
                            <option value="">— unmapped —</option>
                            {source.columns.map((column) => (
                              <option key={column} value={column}>
                                {column}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          {field.neverInvent ? (
                            <span className="badge badge--warn">never invent</span>
                          ) : (
                            <span className="badge">map ok</span>
                          )}
                          {field.hint ? (
                            <span className="hint">{field.hint}</span>
                          ) : null}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="status status--muted">
              Load a source extract to enable mapping.
            </p>
          )}
        </section>

        <section className="panel" aria-labelledby="out-heading">
          <div className="panel__head">
            <h2 id="out-heading">4 · Preview & download</h2>
            <p>
              Load-ready CSV uses only mapped source values. No invented codes.
            </p>
          </div>
          {source.status === 'ready' ? (
            <>
              {unmappedRequired.length > 0 ? (
                <p className="status status--error" role="alert">
                  Required fields still unmapped: {unmappedRequired.join(', ')}
                </p>
              ) : (
                <p className="status status--ok">
                  Required fields are mapped. Ready to download.
                </p>
              )}
              <div className="preview-wrap">
                <table className="preview-table">
                  <thead>
                    <tr>
                      {profile.fields.map((field) => (
                        <th key={field.key}>{field.key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, index) => (
                      <tr key={index}>
                        {profile.fields.map((field) => (
                          <td key={field.key}>{row[field.key] || '—'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="download-row">
                <button
                  type="button"
                  className="btn btn--primary"
                  disabled={unmappedRequired.length > 0}
                  onClick={download}
                >
                  Download load-ready CSV
                </button>
                <span className="download-row__meta">
                  {source.rows.length} rows · target {profile.id}
                </span>
              </div>
            </>
          ) : (
            <p className="status status--muted">Waiting on a mapped extract.</p>
          )}
        </section>
      </main>

      <footer className="footer">
        <p>Field Map preview · soft gate access control · files stay in-browser</p>
        <p>
          Contact: DM on X{' '}
          <a
            href="https://x.com/SamE1311025"
            target="_blank"
            rel="noreferrer"
          >
            @SamE1311025
          </a>{' '}
          / request access · Field Map inbox TBD
        </p>
        <p className="footer__disclaimer">
          Does not claim live SAP/ADP/UKG APIs, ACH processing, or Open Payroll
          paycheck calculation.
        </p>
      </footer>
    </div>
  )
}
