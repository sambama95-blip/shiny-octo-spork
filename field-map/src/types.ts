export type ProfileId = 'sap' | 'adp' | 'ukg' | 'smaller'

export type FieldDef = {
  key: string
  label: string
  required: boolean
  neverInvent?: boolean
  hint?: string
}

export type Profile = {
  id: ProfileId
  name: string
  blurb: string
  fields: FieldDef[]
}

export type DemoPack = {
  id: ProfileId
  label: string
  filename: string
  note: string
  csv: string
}

export type FieldMapping = {
  targetKey: string
  sourceColumn: string | null
}

export type SourceState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready'
      filename: string
      columns: string[]
      rows: Record<string, string>[]
      note?: string
    }
