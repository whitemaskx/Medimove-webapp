const fs = require('fs')
const path = require('path')

// Cargar variables de entorno
function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  No se encontró ${filePath}`)
    return
  }
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
  console.log('\n╔════════════════════════════════════════════════════════════════╗')
  console.log('║         DIAGNÓSTICO DE PERSISTENCIA DE RESERVAS              ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')

  // Verificar configuración de BD
  console.log('📋 CONFIGURACIÓN DE BASE DE DATOS:')
  console.log('─'.repeat(60))
  
  const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.mmove_POSTGRES_URL
  if (connectionString) {
    const urlObj = new URL(connectionString)
    console.log(`✓ DATABASE_URL: ${urlObj.protocol}//${urlObj.hostname}/${urlObj.pathname.replace('/', '')}`)
  } else if (process.env.PGHOST) {
    console.log(`✓ Host: ${process.env.PGHOST}`)
    console.log(`✓ User: ${process.env.PGUSER}`)
    console.log(`✓ Database: ${process.env.PGDATABASE}`)
  } else {
    console.log('❌ No hay configuración de base de datos')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })

  let client
  try {
    console.log('\n🔗 CONECTANDO A LA BASE DE DATOS...')
    client = await pool.connect()
    console.log('✓ Conectado exitosamente\n')

    // Verificar tabla
    console.log('📊 ESTADO DE LA TABLA "reservas":')
    console.log('─'.repeat(60))
    
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'reservas'
      )
    `)

    if (!tableExists.rows[0].exists) {
      console.log('⚠️  La tabla "reservas" NO existe - creando...')
      await client.query(`
        CREATE TABLE reservas (
          id SERIAL PRIMARY KEY,
          codigo VARCHAR(50) UNIQUE NOT NULL,
          numero_identificacion VARCHAR(50) NOT NULL,
          nombre_paciente VARCHAR(200) NOT NULL,
          edad INTEGER,
          sexo VARCHAR(20),
          tipo_regimen VARCHAR(50),
          clinica_nombre VARCHAR(200),
          clinica_direccion VARCHAR(300),
          especialidad VARCHAR(100) NOT NULL,
          fecha_cita VARCHAR(20) NOT NULL,
          hora_cita VARCHAR(10) NOT NULL,
          origen_direccion VARCHAR(300),
          destino_direccion VARCHAR(300),
          distancia_km NUMERIC(8,2),
          vehiculo_tipo VARCHAR(50),
          vehiculo_modelo VARCHAR(100),
          vehiculo_placa VARCHAR(20),
          sintomas TEXT,
          nivel_urgencia VARCHAR(20),
          tiene_acompanante BOOLEAN DEFAULT false,
          costo_consulta NUMERIC(12,2) DEFAULT 0,
          costo_transporte NUMERIC(12,2) DEFAULT 0,
          costo_total NUMERIC(12,2) DEFAULT 0,
          descuento_tercera_edad BOOLEAN DEFAULT false,
          descuento_discapacidad BOOLEAN DEFAULT false,
          descuento_subsidio_eps BOOLEAN DEFAULT false,
          estado VARCHAR(20) DEFAULT 'pendiente',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)
      console.log('✓ Tabla creada exitosamente')
    } else {
      console.log('✓ La tabla "reservas" existe')
    }

    // Estructura de columnas
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'reservas'
      ORDER BY ordinal_position
    `)

    console.log('\n  Columnas:')
    columns.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? '(NULL)' : '(NOT NULL)'
      console.log(`    • ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${nullable}`)
    })

    // Contar registros
    const countResult = await client.query('SELECT COUNT(*) as count FROM reservas')
    const totalReservas = parseInt(countResult.rows[0].count)
    
    console.log(`\n  Total de registros: ${totalReservas}`)

    // Prueba de persistencia: insertar, verificar y eliminar
    console.log('\n\n🧪 PRUEBA DE PERSISTENCIA:')
    console.log('─'.repeat(60))

    const testCodigo = `TEST${Date.now()}`
    console.log(`\n1️⃣  Insertando registro de prueba: ${testCodigo}`)

    const insertResult = await client.query(
      `INSERT INTO reservas (
        codigo, numero_identificacion, nombre_paciente, edad, 
        especialidad, fecha_cita, hora_cita, estado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, created_at`,
      [
        testCodigo,
        'TEST999999',
        'Paciente Prueba',
        30,
        'Test',
        '2024-01-01',
        '10:00',
        'test'
      ]
    )

    const insertedId = insertResult.rows[0].id
    console.log(`   ✓ Insertado con ID: ${insertedId}`)

    // Verificar inmediatamente
    console.log('\n2️⃣  Verificando registro inmediatamente...')
    const verifyResult = await client.query(
      'SELECT * FROM reservas WHERE codigo = $1',
      [testCodigo]
    )

    if (verifyResult.rows.length > 0) {
      console.log(`   ✓ Registro encontrado (${verifyResult.rows.length} resultados)`)
      console.log(`   → ID: ${verifyResult.rows[0].id}`)
      console.log(`   → Paciente: ${verifyResult.rows[0].nombre_paciente}`)
    } else {
      console.log('   ❌ PROBLEMA: Registro no encontrado inmediatamente después de insertar')
    }

    // Eliminar registro de prueba
    console.log('\n3️⃣  Limpiando registro de prueba...')
    await client.query('DELETE FROM reservas WHERE codigo = $1', [testCodigo])
    console.log('   ✓ Registro eliminado')

    // Mostrar últimas reservas
    console.log('\n\n📝 ÚLTIMAS RESERVAS EN LA BASE DE DATOS:')
    console.log('─'.repeat(60))

    const recent = await client.query(`
      SELECT 
        id,
        codigo,
        numero_identificacion,
        nombre_paciente,
        especialidad,
        created_at
      FROM reservas
      ORDER BY created_at DESC
      LIMIT 10
    `)

    if (recent.rows.length === 0) {
      console.log('⚠️  No hay reservas en la base de datos')
    } else {
      recent.rows.forEach((row, idx) => {
        const fecha = new Date(row.created_at).toLocaleString('es-CO')
        console.log(`\n  ${idx + 1}. [${row.codigo}]`)
        console.log(`     Paciente: ${row.nombre_paciente}`)
        console.log(`     ID: ${row.numero_identificacion}`)
        console.log(`     Especialidad: ${row.especialidad}`)
        console.log(`     Creado: ${fecha}`)
      })
    }

    // Agrupar por número de identificación
    const byId = await client.query(`
      SELECT 
        numero_identificacion,
        COUNT(*) as cantidad,
        MAX(created_at) as ultima_reserva
      FROM reservas
      GROUP BY numero_identificacion
      ORDER BY MAX(created_at) DESC
      LIMIT 10
    `)

    console.log('\n\n👥 RESERVAS POR PACIENTE (Top 10):')
    console.log('─'.repeat(60))

    if (byId.rows.length === 0) {
      console.log('⚠️  No hay datos agrupados')
    } else {
      byId.rows.forEach((row, idx) => {
        const fecha = new Date(row.ultima_reserva).toLocaleString('es-CO')
        console.log(`${idx + 1}. ${row.numero_identificacion.padEnd(15)} - ${row.cantidad} reserva(s) - Última: ${fecha}`)
      })
    }

    console.log('\n\n✅ DIAGNÓSTICO COMPLETADO')
    console.log('═'.repeat(60) + '\n')

  } catch (error) {
    console.error('\n❌ ERROR EN DIAGNÓSTICO:')
    console.error(error.message)
    if (error.detail) console.error('Detalle:', error.detail)
    process.exitCode = 1
  } finally {
    if (client) client.release()
    await pool.end()
  }
})()
