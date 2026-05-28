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
    
    // Obtener todas las tablas
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)
    
    console.log('=== TABLAS EN LA BASE DE DATOS ===\n')
    
    for (const table of tablesResult.rows) {
      const tableName = table.table_name
      
      // Obtener estructura de cada tabla
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [tableName])
      
      console.log(`\n📊 Tabla: ${tableName}`)
      console.log('─'.repeat(60))
      columnsResult.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? '[NULL]' : '[NOT NULL]'
        const defaultVal = col.column_default ? ` DEFAULT: ${col.column_default}` : ''
        console.log(`  ${col.column_name.padEnd(30)} ${col.data_type.padEnd(20)} ${nullable}${defaultVal}`)
      })
      
      // Contar filas
      const countResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`)
      console.log(`  Filas: ${countResult.rows[0].count}`)
    }
    
  } catch (err) {
    console.error('Error:', err)
    process.exitCode = 1
  } finally {
    if (client) client.release()
    await pool.end()
  }
})()
