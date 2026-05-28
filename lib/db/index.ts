import { Pool } from 'pg'

// Disable SSL certificate validation for Supabase pooler
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

let _pool: Pool | null = null

function getPool(): Pool {
  if (_pool) return _pool

  const connectionString =
    process.env.DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.mmove_POSTGRES_URL ||
    process.env.POSTGRES_URL

  const ssl = { rejectUnauthorized: false }

  if (connectionString) {
    _pool = new Pool({ connectionString, ssl })
  } else if (process.env.PGHOST || process.env.mmove_POSTGRES_HOST) {
    _pool = new Pool({
      host: process.env.PGHOST || process.env.mmove_POSTGRES_HOST,
      user: process.env.PGUSER || process.env.mmove_POSTGRES_USER,
      password: process.env.PGPASSWORD || process.env.mmove_POSTGRES_PASSWORD,
      database: process.env.PGDATABASE || process.env.mmove_POSTGRES_DATABASE,
      ssl,
    })
  } else {
    throw new Error(
      'Falta la configuración de la base de datos. Define DATABASE_URL, NEON_DATABASE_URL, mmove_POSTGRES_URL, o las variables de conexión individual.'
    )
  }

  return _pool
}

// Proxy lazy: no crea la conexión al importar, solo cuando se usa
export const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    return (getPool() as any)[prop]
  },
})
