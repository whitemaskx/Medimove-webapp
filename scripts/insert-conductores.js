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

    // Datos de conductores de prueba
    const conductores = [
      {
        nombre: 'Carlos Andrés Gómez',
        identificacion: '12345678',
        telefono: '3001234567',
        email: 'carlos.gomez@example.com',
        licencia: 'LIC-2024-001',
        placa: 'ABC-123',
      },
      {
        nombre: 'María del Carmen Ruiz',
        identificacion: '87654321',
        telefono: '3009876543',
        email: 'maria.ruiz@example.com',
        licencia: 'LIC-2024-002',
        placa: 'DEF-456',
      },
      {
        nombre: 'Juan Pablo López',
        identificacion: '11223344',
        telefono: '3005551234',
        email: 'juan.lopez@example.com',
        licencia: 'LIC-2024-003',
        placa: 'GHI-789',
      },
      {
        nombre: 'Sandra Esperanza Martínez',
        identificacion: '44332211',
        telefono: '3004445678',
        email: 'sandra.martinez@example.com',
        licencia: 'LIC-2024-004',
        placa: 'JKL-012',
      },
      {
        nombre: 'Roberto Hernández Díaz',
        identificacion: '55667788',
        telefono: '3008889999',
        email: 'roberto.hernandez@example.com',
        licencia: 'LIC-2024-005',
        placa: 'MNO-345',
      },
    ]

    // Verificar si ya existen
    const existentes = await client.query('SELECT COUNT(*) as count FROM conductores')
    if (existentes.rows[0].count > 0) {
      console.log(`⚠️  Ya existen ${existentes.rows[0].count} conductores. Insertando nuevos...`)
    }

    // Insertar conductores
    let insertados = 0
    for (const conductor of conductores) {
      const result = await client.query(
        `INSERT INTO conductores (nombre, identificacion, telefono, email, licencia, placa)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (identificacion) DO NOTHING
         RETURNING id`,
        [
          conductor.nombre,
          conductor.identificacion,
          conductor.telefono,
          conductor.email,
          conductor.licencia,
          conductor.placa,
        ]
      )
      if (result.rows.length > 0) {
        insertados++
        console.log(`✓ ${conductor.nombre} (ID: ${result.rows[0].id})`)
      } else {
        console.log(`⊘ ${conductor.nombre} ya existe`)
      }
    }

    console.log(`\n✓ Se insertaron ${insertados} conductores nuevos`)

    // Mostrar resumen
    const totalResult = await client.query('SELECT COUNT(*) as count FROM conductores')
    console.log(`\nTotal de conductores en BD: ${totalResult.rows[0].count}`)

    const listado = await client.query('SELECT id, nombre, licencia, placa FROM conductores ORDER BY id')
    console.log('\n📋 Conductores disponibles:')
    listado.rows.forEach(row => {
      console.log(`  [${row.id}] ${row.nombre} - ${row.licencia} - Placa: ${row.placa}`)
    })
  } catch (err) {
    console.error('✗ Error:', err.message || err)
    process.exitCode = 1
  } finally {
    if (client) client.release()
    await pool.end()
  }
})()
