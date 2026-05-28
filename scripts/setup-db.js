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
    
    // Crear tabla reservas si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS reservas (
        id SERIAL PRIMARY KEY,
        numero_identificacion VARCHAR(255) NOT NULL,
        nombre_paciente VARCHAR(255) NOT NULL,
        edad INT NOT NULL,
        sexo VARCHAR(50),
        tipo_regimen VARCHAR(100),
        clinica_nombre VARCHAR(255),
        clinica_direccion TEXT,
        especialidad VARCHAR(255),
        fecha_cita DATE,
        hora_cita TIME,
        vehiculo_tipo VARCHAR(100),
        vehiculo_modelo VARCHAR(100),
        vehiculo_placa VARCHAR(50),
        origen_direccion TEXT,
        destino_direccion TEXT,
        distancia_km DECIMAL(10,2),
        costo_consulta DECIMAL(10,2),
        costo_transporte DECIMAL(10,2),
        costo_total DECIMAL(10,2),
        sintomas TEXT,
        nivel_urgencia VARCHAR(50),
        tiene_acompanante BOOLEAN DEFAULT FALSE,
        descuento_tercera_edad BOOLEAN DEFAULT FALSE,
        descuento_discapacidad BOOLEAN DEFAULT FALSE,
        descuento_subsidio_eps BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `)
    
    console.log('✓ Tabla reservas creada/verificada correctamente')
    
    // Verificar estructura
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'reservas'
      ORDER BY ordinal_position
    `)
    
    console.log('\nEstructura de la tabla reservas:')
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`)
    })
    
  } catch (err) {
    console.error('Error al configurar la base de datos:', err)
    process.exitCode = 1
  } finally {
    if (client) client.release()
    await pool.end()
  }
})()
