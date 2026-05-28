import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL

let pool: Pool

if (connectionString) {
	pool = new Pool({ connectionString })
} else if (process.env.PGHOST) {
	// Si se proporcionan variables PGHOST/PGUSER/PGPASSWORD/etc, pg las usará automáticamente
	pool = new Pool()
} else {
	throw new Error(
		'Falta la configuración de la base de datos. Define NEON_DATABASE_URL/DATABASE_URL o las variables PGHOST, PGUSER, PGPASSWORD, PGDATABASE.'
	)
}

export { pool }
export const db = drizzle(pool)
