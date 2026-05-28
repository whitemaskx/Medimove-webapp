'use server'

import { pool } from '@/lib/db'
import type { PoolClient } from 'pg'

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

async function crearTablaReservas(client: PoolClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS reservas (
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
}

export async function guardarReserva(data: ReservaData) {
  const client = await pool.connect()
  try {
    // Crear tabla si no existe
    await crearTablaReservas(client)

    // Validaciones
    if (!data.numeroIdentificacion?.trim()) throw new Error('Número de identificación requerido')
    if (!data.nombrePaciente?.trim()) throw new Error('Nombre del paciente requerido')
    if (!data.especialidad?.trim()) throw new Error('Especialidad requerida')
    if (!data.fechaCita?.trim() || !data.horaCita?.trim()) throw new Error('Fecha y hora de cita son requeridas')

    const edadValue = Number(data.edad)
    if (Number.isNaN(edadValue) || edadValue < 0) throw new Error('Edad inválida')

    const codigo = `RES${Date.now().toString().slice(-12)}`

    // Ejecutar INSERT
    const result = await client.query(
      `INSERT INTO reservas (
        codigo, numero_identificacion, nombre_paciente, edad, sexo, tipo_regimen,
        clinica_nombre, clinica_direccion, especialidad, fecha_cita, hora_cita,
        origen_direccion, destino_direccion, distancia_km,
        vehiculo_tipo, vehiculo_modelo, vehiculo_placa,
        sintomas, nivel_urgencia, tiene_acompanante,
        costo_consulta, costo_transporte, costo_total,
        descuento_tercera_edad, descuento_discapacidad, descuento_subsidio_eps,
        estado
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27
      ) RETURNING id, codigo, created_at`,
      [
        codigo,
        data.numeroIdentificacion.trim(),
        data.nombrePaciente.trim(),
        edadValue,
        data.sexo || null,
        data.tipoRegimen || null,
        data.clinicaNombre || null,
        data.clinicaDireccion || null,
        data.especialidad.trim(),
        data.fechaCita,
        data.horaCita,
        data.origenDireccion || null,
        data.destinoDireccion || null,
        data.distanciaKm ?? null,
        data.vehiculoTipo || null,
        data.vehiculoModelo || null,
        data.vehiculoPlaca || null,
        data.sintomas || null,
        data.nivelUrgencia || null,
        data.tieneAcompanante ?? false,
        data.costoConsulta ?? 0,
        data.costoTransporte ?? 0,
        data.costoTotal ?? 0,
        data.descuentoTerceraEdad ?? false,
        data.descuentoDiscapacidad ?? false,
        data.descuentoSubsidioEps ?? false,
        'pendiente',
      ]
    )

    if (!result.rows[0]) {
      throw new Error('No se pudo obtener la respuesta del INSERT')
    }

    console.log(`✓ Reserva guardada exitosamente: ${codigo}`)
    
    return { 
      success: true, 
      id: result.rows[0].id, 
      codigo: result.rows[0].codigo,
      created_at: result.rows[0].created_at
    }
  } catch (error) {
    console.error('❌ Error guardando reserva:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error al guardar la reserva' }
  } finally {
    client.release()
  }
}

export async function consultarReservas(numeroIdentificacion: string) {
  const client = await pool.connect()
  try {
    await crearTablaReservas(client)

    // Normalizar entrada
    const id = numeroIdentificacion.trim()
    if (!id) {
      return { success: false, error: 'Número de identificación es requerido' }
    }

    const result = await client.query(
      `SELECT * FROM reservas
       WHERE numero_identificacion = $1
       ORDER BY created_at DESC`,
      [id]
    )

    console.log(`Consulta: ${id} - Registros encontrados: ${result.rows.length}`)
    
    return { 
      success: true, 
      reservas: result.rows,
      total: result.rows.length
    }
  } catch (error) {
    console.error('❌ Error consultando reservas:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error al consultar las reservas' }
  } finally {
    client.release()
  }
}

// Función auxiliar para obtener TODAS las reservas (para debugging)
export async function obtenerTodasLasReservas() {
  const client = await pool.connect()
  try {
    await crearTablaReservas(client)

    const result = await client.query(
      `SELECT * FROM reservas
       ORDER BY created_at DESC
       LIMIT 100`
    )

    console.log(`Total de reservas en BD: ${result.rows.length}`)
    
    return { 
      success: true, 
      total: result.rows.length,
      reservas: result.rows
    }
  } catch (error) {
    console.error('❌ Error obteniendo reservas:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error al obtener las reservas' }
  } finally {
    client.release()
  }
}
