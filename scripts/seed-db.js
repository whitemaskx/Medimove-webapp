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
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL no está definida en .env.local')
    process.exitCode = 1
    return
  }
  
  const pool = new Pool({ 
    connectionString,
    rejectUnauthorized: false,
    ssl: {
      rejectUnauthorized: false,
    }
  })
  let client
  try {
    client = await pool.connect()

    console.log('🌱 Iniciando seed de la base de datos...\n')

    // 1. Insertar especialidades
    console.log('📋 Insertando especialidades...')
    const especialidades = [
      { nombre: 'Medicina General', descripcion: 'Consulta médica general', icono: '👨‍⚕️' },
      { nombre: 'Cardiología', descripcion: 'Especialista del corazón', icono: '❤️' },
      { nombre: 'Dermatología', descripcion: 'Especialista de la piel', icono: '🔬' },
      { nombre: 'Pediatría', descripcion: 'Especialista en niños', icono: '👶' },
      { nombre: 'Odontología', descripcion: 'Especialista dental', icono: '🦷' },
      { nombre: 'Neurología', descripcion: 'Especialista del sistema nervioso', icono: '🧠' },
      { nombre: 'Psicología', descripcion: 'Especialista mental', icono: '💭' },
      { nombre: 'Oftalmología', descripcion: 'Especialista de los ojos', icono: '👁️' },
    ]

    for (const esp of especialidades) {
      await client.query(
        `INSERT INTO especialidades (nombre, descripcion, icono)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [esp.nombre, esp.descripcion, esp.icono]
      )
    }
    console.log(`✓ ${especialidades.length} especialidades insertadas\n`)

    // 2. Insertar clínicas
    console.log('🏥 Insertando clínicas...')
    const clinicas = [
      {
        nombre: 'Clínica San Rafael',
        direccion_corta: 'CLI01',
        direccion_completa: 'Carrera 5 #45-120, Bogotá D.C.',
        zona: 'urbana',
        latitud: 4.7110,
        longitud: -74.0721,
      },
      {
        nombre: 'Hospital de la Misericordia',
        direccion_corta: 'HOSP',
        direccion_completa: 'Carrera 8 #56-80, Bogotá D.C.',
        zona: 'urbana',
        latitud: 4.7160,
        longitud: -74.0680,
      },
      {
        nombre: 'Clínica del Bosque',
        direccion_corta: 'CLI02',
        direccion_completa: 'Carrera 19A #44-90, Bogotá D.C.',
        zona: 'rural',
        latitud: 4.6800,
        longitud: -74.0470,
      },
      {
        nombre: 'Centro Médico Los Andes',
        direccion_corta: 'CMED',
        direccion_completa: 'Carrera 7 #68-45, Bogotá D.C.',
        zona: 'urbana',
        latitud: 4.6400,
        longitud: -74.0750,
      },
      {
        nombre: 'Clínica Sánitas',
        direccion_corta: 'CLI03',
        direccion_completa: 'Avenida Calle 100 #12-34, Bogotá D.C.',
        zona: 'urbana',
        latitud: 4.7250,
        longitud: -74.0600,
      },
    ]

    for (const clinica of clinicas) {
      // Generar una dirección corta de máximo 10 caracteres
      const dirCorta = clinica.direccion_corta.substring(0, 10)
      const zona = clinica.zona.substring(0, 10)
      await client.query(
        `INSERT INTO clinicas (nombre, direccion_corta, direccion_completa, zona, latitud, longitud, activa)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         ON CONFLICT DO NOTHING`,
        [clinica.nombre, dirCorta, clinica.direccion_completa, zona, clinica.latitud, clinica.longitud]
      )
    }
    console.log(`✓ ${clinicas.length} clínicas insertadas\n`)

    // 3. Insertar conductores
    console.log('🚗 Insertando conductores...')
    const conductores = [
      {
        nombre: 'Carlos García',
        identificacion: '1023456789',
        telefono: '3001234567',
        licencia: 'CC-1-23456789-0',
        email: 'carlos.garcia@medimove.com',
      },
      {
        nombre: 'Juan Pérez',
        identificacion: '1098765432',
        telefono: '3009876543',
        licencia: 'CC-1-98765432-0',
        email: 'juan.perez@medimove.com',
      },
      {
        nombre: 'María Rodríguez',
        identificacion: '1056789012',
        telefono: '3005678901',
        licencia: 'CC-1-56789012-0',
        email: 'maria.rodriguez@medimove.com',
      },
      {
        nombre: 'Pedro López',
        identificacion: '1012345678',
        telefono: '3012345678',
        licencia: 'CC-1-12345678-0',
        email: 'pedro.lopez@medimove.com',
      },
      {
        nombre: 'Ana Martínez',
        identificacion: '1087654321',
        telefono: '3087654321',
        licencia: 'CC-1-87654321-0',
        email: 'ana.martinez@medimove.com',
      },
    ]

    for (const conductor of conductores) {
      await client.query(
        `INSERT INTO conductores (nombre, identificacion, telefono, email, licencia, activo, disponible, rating, viajes_completados)
         VALUES ($1, $2, $3, $4, $5, true, true, 4.8, 0)
         ON CONFLICT DO NOTHING`,
        [conductor.nombre, conductor.identificacion, conductor.telefono, conductor.email, conductor.licencia]
      )
    }
    console.log(`✓ ${conductores.length} conductores insertados\n`)

    // 4. Insertar descuentos
    console.log('💰 Insertando descuentos...')
    const descuentos = [
      { tipo: 'TERCERA_EDAD', descripcion: 'Descuento para adultos mayores (65+)', porcentaje: 15 },
      { tipo: 'DISCAPACIDAD', descripcion: 'Descuento para personas con discapacidad', porcentaje: 20 },
      { tipo: 'SUBSIDIO_EPS', descripcion: 'Descuento con subsidio EPS', porcentaje: 10 },
      { tipo: 'REFERIDO', descripcion: 'Descuento por referencia', porcentaje: 5 },
    ]

    for (const descuento of descuentos) {
      await client.query(
        `INSERT INTO descuentos (tipo, descripcion, porcentaje, activo)
         VALUES ($1, $2, $3, true)
         ON CONFLICT DO NOTHING`,
        [descuento.tipo, descuento.descripcion, descuento.porcentaje]
      )
    }
    console.log(`✓ ${descuentos.length} descuentos insertados\n`)

    // 5. Verificar datos
    const pacCount = await client.query('SELECT COUNT(*) FROM pacientes')
    const clinCount = await client.query('SELECT COUNT(*) FROM clinicas')
    const condCount = await client.query('SELECT COUNT(*) FROM conductores')
    const espCount = await client.query('SELECT COUNT(*) FROM especialidades')

    console.log('✅ Seed completado:\n')
    console.log(`  📊 Pacientes: ${pacCount.rows[0].count}`)
    console.log(`  🏥 Clínicas: ${clinCount.rows[0].count}`)
    console.log(`  🚗 Conductores: ${condCount.rows[0].count}`)
    console.log(`  📋 Especialidades: ${espCount.rows[0].count}`)
  } catch (err) {
    console.error('❌ Error durante seed:', err)
    process.exitCode = 1
  } finally {
    if (client) client.release()
    await pool.end()
  }
})()
