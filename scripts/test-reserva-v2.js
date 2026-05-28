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

    await client.query('BEGIN')

    const numeroIdentificacion = `TEST-${Date.now()}`

    // 1. Crear/obtener paciente
    const pacienteResult = await client.query(
      `INSERT INTO pacientes (identificacion, nombre, edad, sexo, tipo_regimen)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (identificacion) DO UPDATE SET nombre = EXCLUDED.nombre
       RETURNING id`,
      [numeroIdentificacion, 'Paciente Test', 35, 'masculino', 'contributivo']
    )
    const pacienteId = pacienteResult.rows[0].id
    console.log('✓ Paciente:', { id: pacienteId, numeroIdentificacion })

    // 2. Obtener clínica
    const clinicaResult = await client.query('SELECT id, nombre FROM clinicas LIMIT 1')
    const clinicaId = clinicaResult.rows[0]?.id || null
    const clinicaNombre = clinicaResult.rows[0]?.nombre || 'Clínica Test'
    console.log('✓ Clínica:', { id: clinicaId, nombre: clinicaNombre })

    // 3. Obtener conductor disponible
    const conductorResult = await client.query('SELECT id, nombre, licencia, placa FROM conductores LIMIT 1')
    const conductorId = conductorResult.rows[0]?.id || null
    const conductorNombre = conductorResult.rows[0]?.nombre || 'Conductor Asignado'
    const conductorPlaca = conductorResult.rows[0]?.placa || 'ABC-123'
    console.log('✓ Conductor:', { id: conductorId, nombre: conductorNombre, placa: conductorPlaca })

    // 4. Generar código
    const codigo = `RES${Date.now().toString().slice(-12)}`

    // 5. Insertar reserva
    const reservaResult = await client.query(
      `INSERT INTO reservas (
        codigo,
        paciente_id,
        clinica_id,
        conductor_id,
        origen_direccion,
        destino_direccion,
        distancia_km,
        fecha_reserva,
        hora_recogida,
        hora_cita_medica,
        especialidad_requerida,
        motivo_consulta,
        estado,
        notas
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, codigo`,
      [
        codigo,
        pacienteId,
        clinicaId,
        conductorId,
        'Carrera 10 #20-30, Cartagena',
        clinicaNombre,
        7.5,
        new Date().toISOString().split('T')[0],
        '09:00',
        '10:00',
        'Medicina General',
        'Consulta de control',
        'pendiente',
        JSON.stringify({
          tieneAcompanante: true,
          nivelUrgencia: 'baja',
          vehiculo: { tipo: 'Auto Estándar', modelo: 'Sedán', placa: 'XYZ-789' },
          costos: { consulta: 45000, transporte: 15000, total: 60000 },
        }),
      ]
    )

    await client.query('COMMIT')

    const reserva = reservaResult.rows[0]
    console.log('\n✓ Reserva guardada exitosamente:')
    console.log(`  ID: ${reserva.id}`)
    console.log(`  Código: ${reserva.codigo}`)

    // Verificar
    const verifyResult = await client.query(
      `SELECT r.*, p.nombre as paciente_nombre, c.nombre as clinica_nombre,
              cond.nombre as conductor_nombre, cond.placa
       FROM reservas r
       LEFT JOIN pacientes p ON r.paciente_id = p.id
       LEFT JOIN clinicas c ON r.clinica_id = c.id
       LEFT JOIN conductores cond ON r.conductor_id = cond.id
       WHERE r.id = $1`,
      [reserva.id]
    )

    if (verifyResult.rows.length > 0) {
      const row = verifyResult.rows[0]
      console.log('\n✓ Detalles completos:')
      console.log(`  Paciente: ${row.paciente_nombre}`)
      console.log(`  Clínica: ${row.clinica_nombre}`)
      console.log(`  Conductor: ${row.conductor_nombre}`)
      console.log(`  Placa: ${row.placa}`)
      console.log(`  Fecha: ${row.fecha_reserva}`)
      console.log(`  Especialidad: ${row.especialidad_requerida}`)
    }
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('✗ Error:', err.message || err)
    process.exitCode = 1
  } finally {
    if (client) client.release()
    await pool.end()
  }
})()
