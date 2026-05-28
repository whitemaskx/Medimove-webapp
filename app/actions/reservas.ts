'use server'

import { pool } from '@/lib/db'

export interface ReservaData {
  numeroIdentificacion: string
  nombrePaciente: string
  edad: number
  sexo: string
  tipoRegimen: string
  clinicaNombre: string
  clinicaDireccion?: string
  clinicaId?: number
  especialidad: string
  fechaCita: string
  horaCita: string
  vehiculoTipo?: string
  vehiculoModelo?: string
  vehiculoPlaca?: string
  origenDireccion?: string
  destinoDireccion?: string
  distanciaKm?: number
  costoConsulta: number
  costoTransporte?: number
  costoTotal: number
  sintomas?: string
  nivelUrgencia?: string
  tieneAcompanante?: boolean
  descuentoTerceraEdad?: boolean
  descuentoDiscapacidad?: boolean
  descuentoSubsidioEps?: boolean
}

async function obtenerOCrearPaciente(data: ReservaData) {
  const client = await pool.connect()
  try {
    // Map sexo values to database constraint format (M/F)
    let sexoValue: string | null = null
    if (data.sexo) {
      const sexoLower = data.sexo.toLowerCase()
      if (sexoLower === 'masculino' || sexoLower === 'm') {
        sexoValue = 'M'
      } else if (sexoLower === 'femenino' || sexoLower === 'f') {
        sexoValue = 'F'
      }
    }

    const result = await client.query(
      `INSERT INTO pacientes (identificacion, nombre, edad, sexo, tipo_regimen)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (identificacion) DO UPDATE SET nombre = EXCLUDED.nombre
       RETURNING id`,
      [
        data.numeroIdentificacion,
        data.nombrePaciente,
        data.edad,
        sexoValue,
        data.tipoRegimen || null,
      ]
    )
    return result.rows[0].id
  } finally {
    client.release()
  }
}

async function obtenerClinicaId(clinicaId?: number, clinicaNombre?: string) {
  const client = await pool.connect()
  try {
    if (clinicaId) {
      const result = await client.query('SELECT id FROM clinicas WHERE id = $1', [clinicaId])
      if (result.rows.length > 0) return clinicaId
    }
    if (clinicaNombre) {
      const result = await client.query(
        'SELECT id FROM clinicas WHERE nombre ILIKE $1',
        [`%${clinicaNombre}%`]
      )
      if (result.rows.length > 0) return result.rows[0].id
    }
    return null
  } finally {
    client.release()
  }
}

async function obtenerConductorAleatorio() {
  const client = await pool.connect()
  try {
    const result = await client.query(
      'SELECT id FROM conductores WHERE activo = true OR activo IS NULL ORDER BY RANDOM() LIMIT 1'
    )
    return result.rows[0]?.id || null
  } finally {
    client.release()
  }
}

export async function guardarReserva(data: ReservaData) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const edadValue = Number(data.edad)
    if (!data.numeroIdentificacion?.trim()) {
      throw new Error('Número de identificación requerido')
    }
    if (!data.nombrePaciente?.trim()) {
      throw new Error('Nombre del paciente requerido')
    }
    if (!data.especialidad?.trim()) {
      throw new Error('Especialidad requerida')
    }
    if (!data.fechaCita?.trim() || !data.horaCita?.trim()) {
      throw new Error('Fecha y hora de cita son requeridas')
    }
    if (Number.isNaN(edadValue) || edadValue < 0) {
      throw new Error('Edad inválida')
    }

    // 1. Obtener o crear paciente
    const pacienteId = await obtenerOCrearPaciente(data)

    // 2. Obtener clínica
    const clinicaId = await obtenerClinicaId(data.clinicaId, data.clinicaNombre)

    // 3. Obtener conductor (asignación aleatoria)
    const conductorId = await obtenerConductorAleatorio()

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
      RETURNING id`,
      [
        codigo,
        pacienteId,
        clinicaId,
        conductorId,
        data.origenDireccion || null,
        data.destinoDireccion || null,
        data.distanciaKm ?? null,
        data.fechaCita,
        data.horaCita,
        data.horaCita,
        data.especialidad,
        data.sintomas || null,
        'pendiente',
        JSON.stringify({
          tieneAcompanante: data.tieneAcompanante,
          nivelUrgencia: data.nivelUrgencia,
          vehiculo: {
            tipo: data.vehiculoTipo,
            modelo: data.vehiculoModelo,
            placa: data.vehiculoPlaca,
          },
          costos: {
            consulta: data.costoConsulta,
            transporte: data.costoTransporte,
            total: data.costoTotal,
          },
          descuentos: {
            terceraEdad: data.descuentoTerceraEdad,
            discapacidad: data.descuentoDiscapacidad,
            subsidioEPS: data.descuentoSubsidioEps,
          },
        }),
      ]
    )

    await client.query('COMMIT')
    return { success: true, id: reservaResult.rows[0].id, codigo }
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error guardando reserva:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error al guardar la reserva' }
  } finally {
    client.release()
  }
}

export async function consultarReservas(numeroIdentificacion: string) {
  const client = await pool.connect()
  try {
    const result = await client.query(
      `SELECT r.*, p.nombre as nombre_paciente, c.nombre as clinica_nombre, 
              cond.nombre as conductor_nombre, cond.licencia, cond.placa
       FROM reservas r
       LEFT JOIN pacientes p ON r.paciente_id = p.id
       LEFT JOIN clinicas c ON r.clinica_id = c.id
       LEFT JOIN conductores cond ON r.conductor_id = cond.id
       WHERE p.identificacion = $1
       ORDER BY r.created_at DESC`,
      [numeroIdentificacion]
    )
    return { success: true, reservas: result.rows }
  } catch (error) {
    console.error('Error consultando reservas:', error)
    return { success: false, error: 'Error al consultar las reservas' }
  } finally {
    client.release()
  }
}
