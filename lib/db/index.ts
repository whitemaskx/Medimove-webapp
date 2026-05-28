import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL

let pool: Pool

const poolConfig = {
	rejectUnauthorized: false,
	ssl: {
		rejectUnauthorized: false,
	},
}

if (connectionString) {
	pool = new Pool({ connectionString, ...poolConfig })
} else if (process.env.PGHOST) {
	pool = new Pool({ ...poolConfig })
} else {
	throw new Error(
		'Falta la configuración de la base de datos. Define DATABASE_URL/NEON_DATABASE_URL o las variables PGHOST, PGUSER, PGPASSWORD, PGDATABASE.'
	)
}

export { pool }
export const db = drizzle(pool)
