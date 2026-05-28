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

    const numeroIdentificacion = `TEST-${Date.now()}`
    const reservaResult = await client.query(
      `INSERT INTO reservas (
        numero_identificacion,
        nombre_paciente,
        edad,
        sexo,
        tipo_regimen,
        clinica_nombre,
        clinica_direccion,
        especialidad,
        fecha_cita,
        hora_cita,
        vehiculo_tipo,
        vehiculo_modelo,
        vehiculo_placa,
        origen_direccion,
        destino_direccion,
        distancia_km,
        costo_consulta,
        costo_transporte,
        costo_total,
        sintomas,
        nivel_urgencia,
        tiene_acompanante,
        descuento_tercera_edad,
        descuento_discapacidad,
        descuento_subsidio_eps
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
      RETURNING id`,
      [
        numeroIdentificacion,
        'Paciente Prueba',
        45,
        'femenino',
        'contributivo',
        'Clínica Test',
        'Calle 45 #12-34, Cartagena',
        'Medicina General',
        new Date().toISOString().split('T')[0],
        '09:00',
        'Auto Estándar',
        'Sedán cómodo',
        'ABC123',
        'Carrera 10 #20-30, Cartagena',
        'Clínica Test',
        7.5,
        45000,
        15000,
        60000,
        'Dolor de cabeza',
        'media',
        false,
        false,
        false,
        false,
      ]
    )

    const reserva = reservaResult.rows[0]
    console.log('✓ Reserva de prueba guardada:')
    console.log(`  ID: ${reserva.id}`)
    console.log(`  Identificación: ${numeroIdentificacion}`)

    const verifyResult = await client.query(
      `SELECT * FROM reservas WHERE id = $1`,
      [reserva.id]
    )

    if (verifyResult.rows.length > 0) {
      const row = verifyResult.rows[0]
      console.log('✓ Verificación de reserva:')
      console.log(`  Nombre: ${row.nombre_paciente}`)
      console.log(`  Clínica: ${row.clinica_nombre}`)
      console.log(`  Fecha: ${row.fecha_cita}`)
      console.log(`  Hora: ${row.hora_cita}`)
      console.log(`  Vehículo: ${row.vehiculo_tipo} (${row.vehiculo_modelo})`)
    }
  } catch (err) {
    console.error('✗ Error al guardar la reserva:', err.message || err)
    process.exitCode = 1
  } finally {
    if (client) client?.release()
