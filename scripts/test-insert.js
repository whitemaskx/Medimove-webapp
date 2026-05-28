const fs = require('fs')
const path = require('path')

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return
  const content = fs.readFileSync(filePath, 'utf8')
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx)
    let val = trimmed.slice(idx + 1)
    // strip single/double quotes
    if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
      val = val.slice(1, -1)
    }
    process.env[key] = val
  }
}

const envPath = path.resolve(process.cwd(), '.env.local')
loadDotEnv(envPath)

const { Pool } = require('pg')

;(async () => {
  const pool = new Pool()
  let client
  try {
    client = await pool.connect()
    await client.query(`CREATE TABLE IF NOT EXISTS test_inserts (id serial PRIMARY KEY, name text, created_at timestamptz DEFAULT now())`)
    const name = 'test-' + Date.now()
    const res = await client.query('INSERT INTO test_inserts (name) VALUES ($1) RETURNING id, name, created_at', [name])
    console.log('Insertado:', res.rows[0])
  } catch (err) {
    console.error('Error en la prueba de inserción:', err)
    process.exitCode = 1
  } finally {
    if (client) client.release()
    await pool.end()
  }
})()
