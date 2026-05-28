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
    
    // Obtener información de las restricciones de la tabla pacientes
    const result = await client.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'pacientes'
    `)
    
    console.log('Restricciones en la tabla pacientes:')
    result.rows.forEach(row => {
      console.log(`  - ${row.constraint_name} (${row.constraint_type})`)
    })
    
    // Obtener detalles de las restricciones CHECK
    const checkResult = await client.query(`
      SELECT constraint_name, check_clause
      FROM information_schema.check_constraints
      WHERE constraint_name LIKE '%sexo%'
    `)
    
    if (checkResult.rows.length > 0) {
      console.log('\nRestricciones CHECK para sexo:')
      checkResult.rows.forEach(row => {
        console.log(`  - ${row.constraint_name}: ${row.check_clause}`)
      })
    }
    
  } catch (err) {
    console.error('Error:', err.message)
    process.exitCode = 1
  } finally {
    if (client) client.release()
    await pool.end()
  }
})()
