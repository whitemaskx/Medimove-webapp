import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

const connectionString =
	process.env.DATABASE_URL ||
	process.env.NEON_DATABASE_URL ||
	process.env.mmove_POSTGRES_URL ||
	process.env.POSTGRES_URL

let pool: Pool

const poolConfig = {
	ssl: {
		rejectUnauthorized: false,
	},
}

if (connectionString) {
	pool = new Pool({ connectionString, ...poolConfig })
} else if (process.env.PGHOST || process.env.mmove_POSTGRES_HOST) {
	pool = new Pool({
		host: process.env.PGHOST || process.env.mmove_POSTGRES_HOST,
		user: process.env.PGUSER || process.env.mmove_POSTGRES_USER,
		password: process.env.PGPASSWORD || process.env.mmove_POSTGRES_PASSWORD,
		database: process.env.PGDATABASE || process.env.mmove_POSTGRES_DATABASE,
		...poolConfig,
	})
} else {
	throw new Error(
		'Falta la configuración de la base de datos. Define DATABASE_URL, NEON_DATABASE_URL, mmove_POSTGRES_URL, o las variables de conexión individual.'
	)
}

export { pool }
export const db = drizzle(pool)
